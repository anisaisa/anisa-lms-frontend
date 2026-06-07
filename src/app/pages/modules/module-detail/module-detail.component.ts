import { Component, OnInit, computed, inject, signal } from '@angular/core';

import { toSignal } from '@angular/core/rxjs-interop';

import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { catchError, forkJoin, map, of, throwError } from 'rxjs';

import { finalize } from 'rxjs';



import { CourseDto } from '../../../models/course.dto';

import { ModuleDto } from '../../../models/module.dto';

import { StudentModuleProgressDto } from '../../../models/student-module-progress.dto';

import { UserRole } from '../../../models/user-role';

import { AuthService } from '../../../services/auth.service';

import { ModuleService } from '../../../services/module.service';

import { ProgressService } from '../../../services/progress.service';

import { MarkModuleCompleteComponent } from '../../../shared/components/mark-module-complete/mark-module-complete.component';

import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

import { PageAlertComponent } from '../../../shared/components/page-alert/page-alert.component';

import {
  getApiErrorMessage,
  isEnrollmentAccessDenied,
} from '../../../shared/utils/api-error.util';

import {

  applyModuleLockState,

  getProgressForModule,

  unlockAllModulesForStaff,

} from '../../../shared/utils/progress.util';



@Component({

  selector: 'app-module-detail',

  imports: [

    RouterLink,

    PageAlertComponent,

    LoadingSpinnerComponent,

    MarkModuleCompleteComponent,

  ],

  templateUrl: './module-detail.component.html',

  styleUrl: './module-detail.component.css',

})

export class ModuleDetailComponent implements OnInit {

  private readonly route = inject(ActivatedRoute);

  private readonly router = inject(Router);

  private readonly auth = inject(AuthService);

  private readonly moduleService = inject(ModuleService);

  private readonly progressService = inject(ProgressService);



  protected readonly courseId = Number(this.route.snapshot.paramMap.get('courseId'));

  protected readonly moduleId = Number(this.route.snapshot.paramMap.get('moduleId'));



  protected readonly course = signal<CourseDto | null>(null);

  protected readonly module = signal<ModuleDto | null>(null);

  protected readonly progressList = signal<StudentModuleProgressDto[]>([]);

  protected readonly loading = signal(true);

  protected readonly apiError = signal<string | null>(null);



  protected readonly canTrackProgress = toSignal(

    this.auth.currentUser$.pipe(map(() => this.auth.hasRole(UserRole.Student))),

    { initialValue: this.auth.hasRole(UserRole.Student) },

  );



  protected readonly studentId = computed(() => this.auth.currentUser?.id ?? '');



  protected readonly moduleProgress = computed(() => {

    const list = this.progressList();

    const mod = this.module();

    if (!mod) {

      return null;

    }

    return getProgressForModule(list, mod.id) ?? null;

  });



  ngOnInit(): void {

    if (!this.courseId || Number.isNaN(this.courseId) || !this.moduleId || Number.isNaN(this.moduleId)) {

      this.apiError.set('Invalid course or module.');

      this.loading.set(false);

      return;

    }



    const stateModule = history.state?.['module'] as ModuleDto | undefined;

    const stateCourse = history.state?.['course'] as CourseDto | undefined;

    const stateProgress = history.state?.['progress'] as StudentModuleProgressDto[] | undefined;

    const stateModules = history.state?.['modules'] as ModuleDto[] | undefined;



    if (stateCourse) {

      this.course.set(stateCourse);

    }



    if (stateProgress) {

      this.progressList.set(stateProgress);

    }



    if (stateModule?.id === this.moduleId) {

      const trackProgress = this.canTrackProgress();

      const progress = trackProgress ? (stateProgress ?? []) : [];

      const modulesForLocks = stateModules?.length ? stateModules : [stateModule];

      const withLocks = trackProgress

        ? applyModuleLockState(modulesForLocks, progress)

        : unlockAllModulesForStaff(modulesForLocks);

      const resolved = withLocks.find((m) => m.id === this.moduleId) ?? stateModule;



      if (trackProgress && resolved.isLocked) {

        this.redirectLocked();

        return;

      }



      this.module.set(trackProgress ? resolved : { ...resolved, isLocked: false });



      if (stateProgress || !trackProgress) {

        this.loading.set(false);

        return;

      }

    }



    this.loadModule();

  }



  protected onProgressChanged(): void {

    this.loadModule();

  }



  protected reloadProgress(): void {

    const user = this.auth.currentUser;

    if (!user?.id || !this.canTrackProgress()) {

      return;

    }



    this.progressService.getProgress(user.id, this.courseId).subscribe({

      next: (progress) => this.progressList.set(progress),

      error: () => undefined,

    });

  }



  private loadModule(): void {

    const user = this.auth.currentUser;

    if (!user?.id) {

      this.apiError.set('You must be signed in.');

      this.loading.set(false);

      return;

    }



    const trackProgress = this.canTrackProgress();



    forkJoin({

      modules: this.moduleService.getModulesForCourse(this.courseId, user.id).pipe(
        catchError((error) => {
          if (isEnrollmentAccessDenied(error)) {
            this.apiError.set(getApiErrorMessage(error));
            return of<ModuleDto[]>([]);
          }
          return throwError(() => error);
        }),
      ),

      progress: trackProgress

        ? this.progressService.getProgress(user.id, this.courseId)

        : of<StudentModuleProgressDto[]>([]),

    })

      .pipe(finalize(() => this.loading.set(false)))

      .subscribe({

        next: ({ modules, progress }) => {

          if (this.apiError() && modules.length === 0) {
            return;
          }

          this.progressList.set(progress);

          const withLocks = trackProgress

            ? applyModuleLockState(modules, progress)

            : unlockAllModulesForStaff(modules);

          const found = withLocks.find((m) => m.id === this.moduleId);



          if (!found) {

            this.apiError.set('Module not found.');

            return;

          }



          if (trackProgress && found.isLocked) {

            this.redirectLocked();

            return;

          }



          this.module.set(found);

        },

        error: (error) =>

          this.apiError.set(getApiErrorMessage(error, 'Failed to load module.')),

      });

  }



  private redirectLocked(): void {

    void this.router.navigate(['/courses', this.courseId], {

      state: { course: this.course() },

    });

  }

}


