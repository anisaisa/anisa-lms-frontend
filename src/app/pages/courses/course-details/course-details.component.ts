import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';

import { toSignal } from '@angular/core/rxjs-interop';

import { ActivatedRoute, NavigationEnd, Router, RouterLink } from '@angular/router';

import { catchError, filter, forkJoin, map, of, Subscription, throwError } from 'rxjs';
import { finalize } from 'rxjs';



import { AssessmentDto } from '../../../models/assessment.dto';
import { CourseDto } from '../../../models/course.dto';

import { ModuleDto } from '../../../models/module.dto';

import { StudentModuleProgressDto } from '../../../models/student-module-progress.dto';

import { UserRole } from '../../../models/user-role';

import { AuthService } from '../../../services/auth.service';

import { CourseService } from '../../../services/course.service';

import { ModuleService } from '../../../services/module.service';

import { ProgressService } from '../../../services/progress.service';

import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

import { CourseProgressSummaryComponent } from '../../../shared/components/course-progress-summary/course-progress-summary.component';

import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

import { MarkModuleCompleteComponent } from '../../../shared/components/mark-module-complete/mark-module-complete.component';

import { PageAlertComponent } from '../../../shared/components/page-alert/page-alert.component';

import {

  ApiFieldErrors,

  getApiErrorMessage,

  getApiFieldErrors,

  isEnrollmentAccessDenied,

} from '../../../shared/utils/api-error.util';

import {

  unlockAllModulesForStaff,

  computeCourseProgressStats,

  formatCompletionDate,

  getProgressForModule,

  isModuleCompleted,

} from '../../../shared/utils/progress.util';
import {
  formatAssessmentDueDate,
  isAssessmentOverdue,
} from '../../../shared/utils/assessment.util';



@Component({

  selector: 'app-course-details',

  imports: [

    RouterLink,

    PageAlertComponent,

    LoadingSpinnerComponent,

    ConfirmDialogComponent,

    CourseProgressSummaryComponent,

    MarkModuleCompleteComponent,

  ],

  templateUrl: './course-details.component.html',

  styleUrl: './course-details.component.css',

})

export class CourseDetailsComponent implements OnInit, OnDestroy {

  private readonly route = inject(ActivatedRoute);

  private readonly router = inject(Router);
  private routerSubscription?: Subscription;

  private readonly auth = inject(AuthService);

  private readonly courseService = inject(CourseService);

  private readonly moduleService = inject(ModuleService);

  private readonly progressService = inject(ProgressService);



  protected readonly courseId = Number(this.route.snapshot.paramMap.get('courseId'));

  protected readonly course = signal<CourseDto | null>(null);

  protected readonly modules = signal<ModuleDto[]>([]);

  protected readonly progressList = signal<StudentModuleProgressDto[]>([]);

  protected readonly loading = signal(true);

  protected readonly progressLoading = signal(true);

  protected readonly apiError = signal<string | null>(null);

  protected readonly enrollmentAccessMessage = signal<string | null>(null);

  protected readonly fieldErrors = signal<ApiFieldErrors>({});



  protected readonly deleteDialogOpen = signal(false);

  protected readonly moduleToDelete = signal<ModuleDto | null>(null);



  protected readonly canManageModules = toSignal(

    this.auth.currentUser$.pipe(

      map(() => this.auth.hasRole(UserRole.Admin, UserRole.Instructor)),

    ),

    { initialValue: this.auth.hasRole(UserRole.Admin, UserRole.Instructor) },

  );



  protected readonly canTrackProgress = toSignal(

    this.auth.currentUser$.pipe(map(() => this.auth.hasRole(UserRole.Student))),

    { initialValue: this.auth.hasRole(UserRole.Student) },

  );

  protected readonly showStudentLearning = computed(
    () => this.canTrackProgress() && !this.enrollmentAccessMessage(),
  );



  protected readonly studentId = computed(() => this.auth.currentUser?.id ?? '');



  protected readonly sortedModules = computed(() =>

    [...this.modules()].sort((a, b) => a.orderIndex - b.orderIndex),

  );



  protected readonly progressStats = computed(() =>

    computeCourseProgressStats(this.modules(), this.progressList()),

  );

  protected readonly courseAssessments = computed(() => {
    const assessments = this.course()?.assessments ?? [];
    return [...assessments].sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
    );
  });



  protected readonly successMessage = signal<string | null>(null);



  ngOnInit(): void {

    if (!this.courseId || Number.isNaN(this.courseId)) {

      this.apiError.set('Invalid course.');

      this.loading.set(false);

      this.progressLoading.set(false);

      return;

    }



    const stateCourse = history.state?.['course'] as CourseDto | undefined;

    if (stateCourse?.id === this.courseId) {

      this.course.set(stateCourse);

    }



    this.applyNavigationMessage();

    this.loadData();

    this.routerSubscription = this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        filter((event) => {
          const coursePath = `/courses/${this.courseId}`;
          return (
            event.urlAfterRedirects.startsWith(coursePath) &&
            !event.urlAfterRedirects.includes('/modules/')
          );
        }),
      )
      .subscribe(() => this.loadData());

  }

  ngOnDestroy(): void {
    this.routerSubscription?.unsubscribe();
  }



  protected nextOrderIndex(): number {

    const modules = this.sortedModules();

    if (!modules.length) {

      return 0;

    }

    return Math.max(...modules.map((m) => m.orderIndex)) + 1;

  }



  protected loadData(): void {

    const user = this.auth.currentUser;

    if (!user?.id) {

      this.apiError.set('You must be signed in to view modules.');

      this.loading.set(false);

      this.progressLoading.set(false);

      return;

    }



    this.loading.set(true);

    this.progressLoading.set(true);

    this.apiError.set(null);

    this.enrollmentAccessMessage.set(null);



    this.courseService.getCourseById(this.courseId).subscribe({
      next: (c) => {
        if (c) {
          this.course.set(c);
        }
      },
      error: () => undefined,
    });



    const trackProgress = this.canTrackProgress();

    forkJoin({

      modules: this.moduleService.getModulesForCourse(this.courseId, user.id).pipe(
        catchError((error) => {
          if (isEnrollmentAccessDenied(error)) {
            this.enrollmentAccessMessage.set(getApiErrorMessage(error));
            return of<ModuleDto[]>([]);
          }
          return throwError(() => error);
        }),
      ),

      progress: trackProgress

        ? this.progressService.getProgress(user.id, this.courseId)

        : of<StudentModuleProgressDto[]>([]),

    })

      .pipe(

        finalize(() => {

          this.loading.set(false);

          this.progressLoading.set(false);

        }),

      )

      .subscribe({

        next: ({ modules, progress }) => {
          this.progressList.set(progress);
          // Module lock flags come from the API (fresh DB progress). Do not re-apply
          // client-side locks from cached GET /progress — that kept module 2 locked.
          this.modules.set(
            trackProgress ? modules : unlockAllModulesForStaff(modules),
          );
        },

        error: (error) => this.handleError(error),

      });

  }



  protected onProgressChanged(): void {

    this.loadData();

  }



  protected moduleProgress(moduleId: number): StudentModuleProgressDto | undefined {

    return getProgressForModule(this.progressList(), moduleId);

  }



  protected moduleIsCompleted(moduleId: number): boolean {

    return isModuleCompleted(this.progressList(), moduleId);

  }



  protected moduleCompletionLabel(moduleId: number): string | null {

    const entry = this.moduleProgress(moduleId);

    if (!entry?.isCompleted) {

      return null;

    }

    return formatCompletionDate(entry.completionDate);

  }



  protected openModule(module: ModuleDto): void {

    if (module.isLocked) {

      return;

    }



    void this.router.navigate(['/courses', this.courseId, 'modules', module.id], {
      state: {
        module,
        course: this.course(),
        modules: this.modules(),
        progress: this.progressList(),
      },
    });

  }



  protected editModule(module: ModuleDto, event: Event): void {

    event.stopPropagation();

    event.preventDefault();

    void this.router.navigate(['/courses', this.courseId, 'modules', module.id, 'edit'], {

      state: { module, course: this.course() },

    });

  }



  protected openDeleteDialog(module: ModuleDto, event: MouseEvent): void {

    event.stopPropagation();

    event.preventDefault();

    this.moduleToDelete.set(module);

    this.deleteDialogOpen.set(true);

  }



  protected closeDeleteDialog(): void {

    this.deleteDialogOpen.set(false);

    this.moduleToDelete.set(null);

  }



  protected confirmDelete(): void {

    const module = this.moduleToDelete();

    if (!module) {

      return;

    }



    this.moduleService.deleteModule(module.id).subscribe({

      next: () => {

        this.closeDeleteDialog();

        this.loadData();

      },

      error: (error) => {

        this.closeDeleteDialog();

        this.handleError(error);

      },

    });

  }



  protected deleteMessage(): string {

    const title = this.moduleToDelete()?.title ?? 'this module';

    return `Delete "${title}"? This cannot be undone.`;

  }



  protected detailsEyebrow(): string {
    if (this.auth.hasRole(UserRole.Admin)) {
      return 'Admin course view';
    }
    if (this.auth.hasRole(UserRole.Instructor)) {
      return 'Instructor course view';
    }
    return 'Student learning path';
  }

  protected moduleNumber(module: ModuleDto): number {

    return module.orderIndex;

  }

  protected formatAssessmentDue(assessment: AssessmentDto): string {
    return formatAssessmentDueDate(assessment.dueDate);
  }

  protected assessmentIsOverdue(assessment: AssessmentDto): boolean {
    return isAssessmentOverdue(assessment);
  }

  protected stopCardClick(event: Event): void {

    event.stopPropagation();

    event.preventDefault();

  }



  private applyNavigationMessage(): void {

    const saved = history.state?.['moduleSaved'] as string | undefined;

    if (saved === 'created') {

      this.successMessage.set('Module created successfully.');

    } else if (saved === 'updated') {

      this.successMessage.set('Module updated successfully.');

    }

    if (history.state?.['progressUpdated']) {
      this.successMessage.set('Progress updated successfully.');
    }
  }



  private handleError(error: unknown): void {

    this.fieldErrors.set(getApiFieldErrors(error));

    this.apiError.set(getApiErrorMessage(error, 'Failed to load course data.'));

  }

}

