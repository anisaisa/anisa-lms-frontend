import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import { UserListItem } from '../../../models/user.dto';
import { CourseService } from '../../../services/course.service';
import { UserService } from '../../../services/user.service';
import {
  ApiFieldErrors,
  getApiErrorMessage,
  getApiFieldErrors,
} from '../../../shared/utils/api-error.util';
import {
  buildCourseForm,
  toCreateCourseDto,
} from '../../../shared/utils/course-form.util';
import { CourseFormComponent } from '../course-form/course-form.component';

@Component({
  selector: 'app-course-create',
  imports: [CourseFormComponent],
  template: `
    <app-course-form
      [form]="form"
      [instructors]="instructors()"
      [loadingInstructors]="loadingInstructors()"
      [submitting]="submitting()"
      [apiError]="apiError()"
      [fieldErrors]="fieldErrors()"
      heading="Create course"
      subtitle="Add a new course to the catalog."
      submitLabel="Create course"
      (submitted)="submit()"
    />
  `,
})
export class CourseCreateComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly courseService = inject(CourseService);
  private readonly userService = inject(UserService);
  private readonly router = inject(Router);

  protected readonly form = buildCourseForm(this.fb);
  protected readonly instructors = signal<UserListItem[]>([]);
  protected readonly loadingInstructors = signal(false);
  protected readonly submitting = signal(false);
  protected readonly apiError = signal<string | null>(null);
  protected readonly fieldErrors = signal<ApiFieldErrors>({});

  ngOnInit(): void {
    this.loadInstructors();
  }

  protected submit(): void {
    this.apiError.set(null);
    this.fieldErrors.set({});

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);

    this.courseService
      .createCourse(toCreateCourseDto(this.form.getRawValue()))
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () =>
          void this.router.navigate(['/courses'], {
            state: { courseSaved: 'created' },
          }),
        error: (error) => this.handleError(error),
      });
  }

  private loadInstructors(): void {
    this.loadingInstructors.set(true);

    this.userService
      .getUsers()
      .pipe(finalize(() => this.loadingInstructors.set(false)))
      .subscribe({
        next: (users) => this.instructors.set(users),
        error: (error) =>
          this.apiError.set(getApiErrorMessage(error, 'Failed to load instructors.')),
      });
  }

  private handleError(error: unknown): void {
    this.fieldErrors.set(getApiFieldErrors(error));
    this.apiError.set(getApiErrorMessage(error, 'Failed to create course.'));
  }
}
