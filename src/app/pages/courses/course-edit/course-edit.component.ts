import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { CourseDto } from '../../../models/course.dto';
import { UserListItem } from '../../../models/user.dto';
import { CourseService } from '../../../services/course.service';
import { UserService } from '../../../services/user.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { PageAlertComponent } from '../../../shared/components/page-alert/page-alert.component';
import {
  ApiFieldErrors,
  getApiErrorMessage,
  getApiFieldErrors,
} from '../../../shared/utils/api-error.util';
import {
  buildCourseForm,
  toUpdateCourseDto,
} from '../../../shared/utils/course-form.util';
import { CourseFormComponent } from '../course-form/course-form.component';

@Component({
  selector: 'app-course-edit',
  imports: [CourseFormComponent, LoadingSpinnerComponent, PageAlertComponent, RouterLink],
  template: `
    @if (loadingCourse()) {
      <app-loading-spinner label="Loading course..." />
    } @else if (!courseFound()) {
      <app-page-alert [message]="apiError() ?? 'Course not found.'" />
      <a class="btn btn--ghost" routerLink="/courses" style="margin-top: 1rem; display: inline-flex">
        Back to courses
      </a>
    } @else {
      <app-course-form
        [form]="form"
        [instructors]="instructors()"
        [loadingInstructors]="loadingInstructors()"
        [submitting]="submitting()"
        [apiError]="apiError()"
        [fieldErrors]="fieldErrors()"
        heading="Edit course"
        [subtitle]="'Update details for ' + (course()?.title ?? 'course')"
        submitLabel="Save changes"
        (submitted)="submit()"
      />
    }
  `,
  styles: `
    :host {
      display: block;
    }
    .btn {
      padding: 0.65rem 1rem;
      border-radius: var(--radius-md);
      color: var(--text-muted);
      text-decoration: none;
      border: 1px solid var(--border);
    }
  `,
})
export class CourseEditComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly courseService = inject(CourseService);
  private readonly userService = inject(UserService);

  protected readonly form = buildCourseForm(this.fb);
  protected readonly course = signal<CourseDto | null>(null);
  protected readonly instructors = signal<UserListItem[]>([]);
  protected readonly loadingCourse = signal(true);
  protected readonly loadingInstructors = signal(false);
  protected readonly submitting = signal(false);
  protected readonly courseFound = signal(false);
  protected readonly apiError = signal<string | null>(null);
  protected readonly fieldErrors = signal<ApiFieldErrors>({});

  private courseId = 0;

  ngOnInit(): void {
    this.courseId = Number(this.route.snapshot.paramMap.get('courseId'));
    this.loadInstructors();

    const stateCourse = history.state?.['course'] as CourseDto | undefined;
    if (stateCourse?.id === this.courseId) {
      this.applyCourse(stateCourse);
      return;
    }

    this.courseService
      .getCourseById(this.courseId)
      .pipe(finalize(() => this.loadingCourse.set(false)))
      .subscribe({
        next: (course) => {
          if (!course) {
            this.courseFound.set(false);
            this.apiError.set('Course not found.');
            return;
          }
          this.applyCourse(course);
        },
        error: (error) => {
          this.courseFound.set(false);
          this.apiError.set(getApiErrorMessage(error, 'Failed to load course.'));
        },
      });
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
      .updateCourse(this.courseId, toUpdateCourseDto(this.form.getRawValue()))
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () =>
          void this.router.navigate(['/courses'], {
            state: { courseSaved: 'updated' },
          }),
        error: (error) => this.handleError(error),
      });
  }

  private applyCourse(course: CourseDto): void {
    this.course.set(course);
    this.courseFound.set(true);
    this.loadingCourse.set(false);
    this.form.patchValue({
      instructorId: course.instructorId,
      title: course.title,
      description: course.description ?? '',
      status: course.status,
      maxEnrollments: course.maxEnrollments,
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
    this.apiError.set(getApiErrorMessage(error, 'Failed to update course.'));
  }
}
