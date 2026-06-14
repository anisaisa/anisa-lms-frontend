import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { catchError, forkJoin, map, of } from 'rxjs';
import { finalize } from 'rxjs';

import { AssessmentDto } from '../../../models/assessment.dto';
import { UserRole } from '../../../models/user-role';
import { AuthService } from '../../../services/auth.service';
import { AssessmentService } from '../../../services/assessment.service';
import { CourseService } from '../../../services/course.service';
import { DashboardService } from '../../../services/dashboard.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { PageAlertComponent } from '../../../shared/components/page-alert/page-alert.component';
import { ToastService } from '../../../shared/services/toast.service';
import {
  AssessmentCourseGroup,
  extractAssessmentsFromCourses,
  formatAssessmentDueDate,
  getUpcomingAssessments,
  groupAssessmentsByCourse,
  isAssessmentOverdue,
} from '../../../shared/utils/assessment.util';
import {
  ApiFieldErrors,
  getApiErrorMessage,
  getApiFieldErrors,
} from '../../../shared/utils/api-error.util';

@Component({
  selector: 'app-assessment-list',
  imports: [
    RouterLink,
    PageAlertComponent,
    LoadingSpinnerComponent,
    ConfirmDialogComponent,
    EmptyStateComponent,
  ],
  templateUrl: './assessment-list.component.html',
  styleUrl: './assessment-list.component.css',
})
export class AssessmentListComponent implements OnInit {
  private readonly courseService = inject(CourseService);
  private readonly assessmentService = inject(AssessmentService);
  private readonly dashboardService = inject(DashboardService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  protected readonly loading = signal(true);
  protected readonly deleting = signal(false);
  protected readonly apiError = signal<string | null>(null);
  protected readonly fieldErrors = signal<ApiFieldErrors>({});

  protected readonly allAssessments = signal<AssessmentDto[]>([]);

  protected readonly canManage = toSignal(
    this.auth.currentUser$.pipe(
      map(() => this.auth.hasRole(UserRole.Admin, UserRole.Instructor)),
    ),
    { initialValue: this.auth.hasRole(UserRole.Admin, UserRole.Instructor) },
  );

  protected readonly isStudent = toSignal(
    this.auth.currentUser$.pipe(map(() => this.auth.hasRole(UserRole.Student))),
    { initialValue: this.auth.hasRole(UserRole.Student) },
  );

  protected readonly isAdmin = toSignal(
    this.auth.currentUser$.pipe(map(() => this.auth.hasRole(UserRole.Admin))),
    { initialValue: this.auth.hasRole(UserRole.Admin) },
  );

  protected readonly isInstructor = toSignal(
    this.auth.currentUser$.pipe(map(() => this.auth.hasRole(UserRole.Instructor))),
    { initialValue: this.auth.hasRole(UserRole.Instructor) },
  );

  protected readonly upcomingAssessments = computed(() =>
    getUpcomingAssessments(this.allAssessments()),
  );

  protected readonly courseGroups = computed(() =>
    groupAssessmentsByCourse(this.allAssessments()),
  );

  protected readonly deleteDialogOpen = signal(false);
  protected readonly assessmentToDelete = signal<AssessmentDto | null>(null);

  ngOnInit(): void {
    this.applyNavigationMessage();
    this.loadAssessments();
  }

  protected loadAssessments(): void {
    this.loading.set(true);
    this.apiError.set(null);

    const user = this.auth.currentUser;
    const courses$ = this.courseService.getCourses({ page: 1, pageSize: 500 });

    if (this.auth.hasRole(UserRole.Student)) {
      if (!user?.email) {
        this.loading.set(false);
        this.apiError.set('Sign out and sign in again so we can load your enrolled courses.');
        return;
      }

      forkJoin({
        courses: courses$,
        dashboard: this.dashboardService
          .getStudentDashboard(user.email)
          .pipe(catchError(() => of(null))),
      })
        .pipe(finalize(() => this.loading.set(false)))
        .subscribe({
          next: ({ courses, dashboard }) => {
            const enrolledIds = new Set(
              (dashboard?.coursesInProgress ?? []).map((course) => course.id),
            );
            const enrolledCourses = courses.items.filter((course) => enrolledIds.has(course.id));
            this.allAssessments.set(extractAssessmentsFromCourses(enrolledCourses));
          },
          error: (error) => this.handleError(error),
        });
      return;
    }

    courses$.pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (response) => {
        this.allAssessments.set(extractAssessmentsFromCourses(response.items));
      },
      error: (error) => this.handleError(error),
    });
  }

  protected formatDueDate(assessment: AssessmentDto): string {
    return formatAssessmentDueDate(assessment.dueDate);
  }

  protected isOverdue(assessment: AssessmentDto): boolean {
    return isAssessmentOverdue(assessment);
  }

  protected pageEyebrow(): string {
    if (this.isAdmin()) {
      return 'Admin assessments';
    }
    if (this.isInstructor()) {
      return 'Teaching assessments';
    }
    return 'Student assessments';
  }

  protected pageSubtitle(): string {
    if (this.isStudent()) {
      return 'Assessments for courses where your enrollment is active.';
    }
    if (this.isInstructor()) {
      return 'Review deadlines, requirements, and student results across your courses.';
    }
    return 'Manage assessments, deadlines, and results across the full course catalog.';
  }

  protected editAssessment(assessment: AssessmentDto, event: Event): void {
    event.stopPropagation();
    void this.router.navigate(['/assessments', assessment.id, 'edit'], {
      state: { assessment },
    });
  }

  protected viewResults(assessment: AssessmentDto, event: Event): void {
    event.stopPropagation();
    void this.router.navigate(['/assessments', assessment.id, 'results'], {
      state: { assessment },
    });
  }

  protected openDeleteDialog(assessment: AssessmentDto, event: MouseEvent): void {
    event.stopPropagation();
    this.assessmentToDelete.set(assessment);
    this.deleteDialogOpen.set(true);
  }

  protected closeDeleteDialog(): void {
    this.deleteDialogOpen.set(false);
    this.assessmentToDelete.set(null);
  }

  protected confirmDelete(): void {
    const assessment = this.assessmentToDelete();
    if (!assessment) {
      return;
    }

    this.deleting.set(true);
    this.assessmentService
      .deleteAssessment(assessment.id)
      .pipe(finalize(() => this.deleting.set(false)))
      .subscribe({
        next: () => {
          this.closeDeleteDialog();
          this.toast.success('Assessment deleted successfully.');
          this.loadAssessments();
        },
        error: (error) => {
          this.closeDeleteDialog();
          this.handleError(error);
        },
      });
  }

  protected deleteMessage(): string {
    const title = this.assessmentToDelete()?.title ?? 'this assessment';
    return `Delete assessment "${title}"? This cannot be undone.`;
  }

  protected trackGroup(_index: number, group: AssessmentCourseGroup): number {
    return group.courseId;
  }

  private applyNavigationMessage(): void {
    const saved = history.state?.['assessmentSaved'] as string | undefined;
    if (saved === 'created') {
      this.toast.success('Assessment created successfully.');
    } else if (saved === 'updated') {
      this.toast.success('Assessment updated successfully.');
    }
  }

  private handleError(error: unknown): void {
    this.fieldErrors.set(getApiFieldErrors(error));
    this.apiError.set(getApiErrorMessage(error, 'Failed to load assessments.'));
  }
}
