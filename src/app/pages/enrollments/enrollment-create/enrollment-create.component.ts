import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';

import { CourseDto } from '../../../models/course.dto';
import { UserListItem } from '../../../models/user.dto';
import { CourseService } from '../../../services/course.service';
import { EnrollmentService } from '../../../services/enrollment.service';
import { UserService } from '../../../services/user.service';
import {
  ApiFieldErrors,
  getApiErrorMessage,
  getApiFieldErrors,
} from '../../../shared/utils/api-error.util';
import {
  buildCreateEnrollmentForm,
  toCreateEnrollmentDto,
} from '../../../shared/utils/enrollment-form.util';
import { EnrollmentFormComponent } from '../enrollment-form/enrollment-form.component';

@Component({
  selector: 'app-enrollment-create',
  imports: [EnrollmentFormComponent],
  template: `
    <app-enrollment-form
      [form]="form"
      [courses]="courses()"
      [students]="students()"
      [loadingCourses]="loadingCourses()"
      [loadingStudents]="loadingStudents()"
      [submitting]="submitting()"
      [apiError]="apiError()"
      [fieldErrors]="fieldErrors()"
      heading="Enroll student"
      subtitle="Assign a student to a course with an enrollment status."
      submitLabel="Create enrollment"
      (submitted)="submit()"
    />
  `,
})
export class EnrollmentCreateComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly enrollmentService = inject(EnrollmentService);
  private readonly courseService = inject(CourseService);
  private readonly userService = inject(UserService);

  protected readonly form = buildCreateEnrollmentForm(this.fb);
  protected readonly courses = signal<CourseDto[]>([]);
  protected readonly students = signal<UserListItem[]>([]);
  protected readonly loadingCourses = signal(false);
  protected readonly loadingStudents = signal(false);
  protected readonly submitting = signal(false);
  protected readonly apiError = signal<string | null>(null);
  protected readonly fieldErrors = signal<ApiFieldErrors>({});

  ngOnInit(): void {
    const courseId = Number(this.route.snapshot.queryParamMap.get('courseId'));
    if (courseId && !Number.isNaN(courseId)) {
      this.form.patchValue({ courseId });
    }
    this.loadCourses();
    this.loadStudents();
  }

  protected submit(): void {
    this.apiError.set(null);
    this.fieldErrors.set({});

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.enrollmentService
      .createEnrollment(toCreateEnrollmentDto(this.form.getRawValue()))
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () =>
          void this.router.navigate(['/enrollments'], {
            state: { enrollmentSaved: 'created' },
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
            this.apiError.set(
              'No student accounts yet. Open Sign up in a private/incognito window and register a learner account, then return here.',
            );
          }
        },
        error: (error) =>
          this.apiError.set(getApiErrorMessage(error, 'Failed to load students.')),
      });
  }

  private handleError(error: unknown): void {
    this.fieldErrors.set(getApiFieldErrors(error));
    this.apiError.set(getApiErrorMessage(error, 'Failed to create enrollment.'));
  }
}
