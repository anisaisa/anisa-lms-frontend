import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { DashboardService } from '../../../services/dashboard.service';
import { UserRole } from '../../../models/user-role';


import { CourseDto } from '../../../models/course.dto';
import { AssessmentService } from '../../../services/assessment.service';
import { CourseService } from '../../../services/course.service';
import {
  ApiFieldErrors,
  getApiErrorMessage,
  getApiFieldErrors,
} from '../../../shared/utils/api-error.util';
import {
  buildAssessmentForm,
  toCreateAssessmentDto,
} from '../../../shared/utils/assessment-form.util';
import { AssessmentFormComponent } from '../assessment-form/assessment-form.component';

@Component({
  selector: 'app-assessment-create',
  imports: [AssessmentFormComponent],
  template: `
    <app-assessment-form
      [form]="form"
      [courses]="courses()"
      [loadingCourses]="loadingCourses()"
      [submitting]="submitting()"
      [apiError]="apiError()"
      [fieldErrors]="fieldErrors()"
      heading="Create assessment"
      subtitle="Add an assessment to a course."
      submitLabel="Create assessment"
      (submitted)="submit()"
    />
  `,
})
export class AssessmentCreateComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly assessmentService = inject(AssessmentService);
  private readonly courseService = inject(CourseService);
private readonly auth = inject(AuthService);
private readonly dashboardService = inject(DashboardService);
  protected readonly form = buildAssessmentForm(this.fb);
  protected readonly courses = signal<CourseDto[]>([]);
  protected readonly loadingCourses = signal(false);
  protected readonly submitting = signal(false);
  protected readonly apiError = signal<string | null>(null);
  protected readonly fieldErrors = signal<ApiFieldErrors>({});

  ngOnInit(): void {
    const courseId = Number(this.route.snapshot.queryParamMap.get('courseId'));
    if (courseId && !Number.isNaN(courseId)) {
      this.form.patchValue({ courseId });
    }
    this.loadCourses();
  }

  protected submit(): void {
    this.apiError.set(null);
    this.fieldErrors.set({});

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    const raw = this.form.getRawValue();
    this.assessmentService
      .createAssessment(
        toCreateAssessmentDto({
          ...raw,
          courseId: Number(raw.courseId),
          maxPoints: Number(raw.maxPoints),
          passRequirement: Number(raw.passRequirement),
        }),
      )
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () =>
          void this.router.navigate(['/assessments'], {
            state: { assessmentSaved: 'created' },
          }),
        error: (error) => this.handleError(error),
      });
  }

 private loadCourses(): void {
  this.loadingCourses.set(true);

  if (this.auth.hasRole(UserRole.Admin)) {
    this.courseService
      .getCourses({ page: 1, pageSize: 500 })
      .pipe(finalize(() => this.loadingCourses.set(false)))
      .subscribe({
        next: (response) => this.courses.set(response.items),
        error: (error) =>
          this.apiError.set(
            getApiErrorMessage(error, 'Failed to load courses.')
          ),
      });

    return;
  }

  const user = this.auth.currentUser;

  if (!user?.email) {
    this.loadingCourses.set(false);
    return;
  }

  this.dashboardService
    .getInstructorDashboard(user.email)
    .pipe(finalize(() => this.loadingCourses.set(false)))
    .subscribe({
      next: (dashboard) => {
        this.courses.set(dashboard.myCourses as any);
      },
      error: (error) =>
        this.apiError.set(
          getApiErrorMessage(error, 'Failed to load courses.')
        ),
    });
}
  private handleError(error: unknown): void {
    this.fieldErrors.set(getApiFieldErrors(error));
    this.apiError.set(getApiErrorMessage(error, 'Failed to create assessment.'));
  }
}
