import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, finalize } from 'rxjs';

import { CourseDto } from '../../../models/course.dto';
import { ModuleDto } from '../../../models/module.dto';
import { UserListItem } from '../../../models/user.dto';
import { CourseService } from '../../../services/course.service';
import { ModuleService } from '../../../services/module.service';
import { ProgressService } from '../../../services/progress.service';
import { UserService } from '../../../services/user.service';
import {
  ApiFieldErrors,
  getApiErrorMessage,
  getApiFieldErrors,
} from '../../../shared/utils/api-error.util';
import {
  buildCreateProgressForm,
  toCreateProgressDto,
} from '../../../shared/utils/progress-form.util';
import { ProgressFormComponent } from '../progress-form/progress-form.component';

@Component({
  selector: 'app-progress-create',
  imports: [ProgressFormComponent],
  template: `
    <app-progress-form
      [form]="form"
      [students]="students()"
      [courses]="courses()"
      [modules]="modules()"
      [loadingStudents]="loadingStudents()"
      [loadingCourses]="loadingCourses()"
      [loadingModules]="loadingModules()"
      [submitting]="submitting()"
      [apiError]="apiError()"
      [fieldErrors]="fieldErrors()"
      heading="Record module progress"
      subtitle="Log module completion for a student in a specific course."
      submitLabel="Save progress"
      (submitted)="submit()"
    />
  `,
})
export class ProgressCreateComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly progressService = inject(ProgressService);
  private readonly courseService = inject(CourseService);
  private readonly userService = inject(UserService);
  private readonly moduleService = inject(ModuleService);

  private formSubscription?: Subscription;

  protected readonly form = buildCreateProgressForm(this.fb);
  protected readonly students = signal<UserListItem[]>([]);
  protected readonly courses = signal<CourseDto[]>([]);
  protected readonly modules = signal<ModuleDto[]>([]);
  protected readonly loadingStudents = signal(false);
  protected readonly loadingCourses = signal(false);
  protected readonly loadingModules = signal(false);
  protected readonly submitting = signal(false);
  protected readonly apiError = signal<string | null>(null);
  protected readonly fieldErrors = signal<ApiFieldErrors>({});

  ngOnInit(): void {
    const courseId = Number(this.route.snapshot.queryParamMap.get('courseId'));
    if (courseId && !Number.isNaN(courseId)) {
      this.form.patchValue({ courseId });
    }

    this.loadStudents();
    this.loadCourses();

    this.formSubscription = this.form.valueChanges.subscribe(() => {
      const studentId = this.form.value.studentId;
      const courseIdValue = Number(this.form.value.courseId);
      if (studentId && courseIdValue > 0) {
        this.loadModules(studentId, courseIdValue);
      } else {
        this.modules.set([]);
        this.form.patchValue({ moduleId: 0 }, { emitEvent: false });
      }
    });

    const initialStudentId = this.form.value.studentId;
    const initialCourseId = Number(this.form.value.courseId);
    if (initialStudentId && initialCourseId > 0) {
      this.loadModules(initialStudentId, initialCourseId);
    }
  }

  ngOnDestroy(): void {
    this.formSubscription?.unsubscribe();
  }

  protected submit(): void {
    this.apiError.set(null);
    this.fieldErrors.set({});

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.progressService
      .createProgress(toCreateProgressDto(this.form.getRawValue()))
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () =>
          void this.router.navigate(['/progress'], {
            state: { progressSaved: 'created' },
          }),
        error: (error) => this.handleError(error),
      });
  }

  private loadCourses(): void {
    this.loadingCourses.set(true);
    this.courseService
      .getCourses({ page: 1, pageSize: 500 })
      .pipe(finalize(() => this.loadingCourses.set(false)))
      .subscribe({
        next: (response) => this.courses.set(response.items),
        error: (error) =>
          this.apiError.set(getApiErrorMessage(error, 'Failed to load courses.')),
      });
  }

  private loadStudents(): void {
    this.loadingStudents.set(true);
    this.userService
      .getStudents()
      .pipe(finalize(() => this.loadingStudents.set(false)))
      .subscribe({
        next: (students) => {
          this.students.set(students);
          if (!students.length) {
            this.apiError.set('No student accounts are available yet.');
          }
        },
        error: (error) =>
          this.apiError.set(getApiErrorMessage(error, 'Failed to load students.')),
      });
  }

  private loadModules(studentId: string, courseId: number): void {
    this.loadingModules.set(true);
    this.moduleService
      .getModulesForCourse(courseId, studentId)
      .pipe(finalize(() => this.loadingModules.set(false)))
      .subscribe({
        next: (modules) => {
          this.modules.set(modules);
          const currentModuleId = Number(this.form.value.moduleId);
          if (!modules.some((module) => module.id === currentModuleId)) {
            this.form.patchValue({ moduleId: 0 }, { emitEvent: false });
          }
        },
        error: () => {
          this.modules.set([]);
          this.form.patchValue({ moduleId: 0 }, { emitEvent: false });
        },
      });
  }

  private handleError(error: unknown): void {
    this.fieldErrors.set(getApiFieldErrors(error));
    this.apiError.set(getApiErrorMessage(error, 'Failed to record module progress.'));
  }
}
