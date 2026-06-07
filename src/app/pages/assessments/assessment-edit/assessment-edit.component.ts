import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { AssessmentDto } from '../../../models/assessment.dto';
import { AssessmentService } from '../../../services/assessment.service';
import { CourseService } from '../../../services/course.service';
import { toDateTimeLocalValue } from '../../../shared/utils/assessment.util';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { PageAlertComponent } from '../../../shared/components/page-alert/page-alert.component';
import {
  ApiFieldErrors,
  getApiErrorMessage,
  getApiFieldErrors,
} from '../../../shared/utils/api-error.util';
import {
  buildAssessmentForm,
  toUpdateAssessmentDto,
} from '../../../shared/utils/assessment-form.util';
import { AssessmentFormComponent } from '../assessment-form/assessment-form.component';

@Component({
  selector: 'app-assessment-edit',
  imports: [
    AssessmentFormComponent,
    LoadingSpinnerComponent,
    PageAlertComponent,
    RouterLink,
  ],
  template: `
    @if (loading()) {
      <app-loading-spinner label="Loading assessment..." />
    } @else if (!assessmentFound()) {
      <app-page-alert [message]="apiError() ?? 'Assessment not found.'" />
      <a class="btn btn--ghost" routerLink="/assessments" style="margin-top: 1rem; display: inline-flex">
        Back to assessments
      </a>
    } @else {
      <app-assessment-form
        [form]="form"
        [showCourseSelect]="false"
        [courseTitle]="assessment()?.courseTitle ?? null"
        [submitting]="submitting()"
        [apiError]="apiError()"
        [fieldErrors]="fieldErrors()"
        heading="Edit assessment"
        [subtitle]="'Update ' + (assessment()?.title ?? 'assessment')"
        submitLabel="Save changes"
        (submitted)="submit()"
      />
    }
  `,
  styles: `
    .btn {
      padding: 0.65rem 1rem;
      border-radius: var(--radius-md);
      color: var(--text-muted);
      text-decoration: none;
      border: 1px solid var(--border);
    }
  `,
})
export class AssessmentEditComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly courseService = inject(CourseService);
  private readonly assessmentService = inject(AssessmentService);

  protected readonly form = buildAssessmentForm(this.fb);
  protected readonly assessment = signal<AssessmentDto | null>(null);
  protected readonly loading = signal(true);
  protected readonly assessmentFound = signal(false);
  protected readonly submitting = signal(false);
  protected readonly apiError = signal<string | null>(null);
  protected readonly fieldErrors = signal<ApiFieldErrors>({});

  private assessmentId = 0;

  ngOnInit(): void {
    this.assessmentId = Number(this.route.snapshot.paramMap.get('assessmentId'));
    if (!this.assessmentId || Number.isNaN(this.assessmentId)) {
      this.apiError.set('Invalid assessment.');
      this.loading.set(false);
      return;
    }

    const stateAssessment = history.state?.['assessment'] as AssessmentDto | undefined;
    if (stateAssessment?.id === this.assessmentId) {
      this.applyAssessment(stateAssessment);
      return;
    }

    this.loadAssessment();
  }

  protected submit(): void {
    this.apiError.set(null);
    this.fieldErrors.set({});

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.assessmentService
      .updateAssessment(this.assessmentId, toUpdateAssessmentDto(this.form.getRawValue()))
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () =>
          void this.router.navigate(['/assessments'], {
            state: { assessmentSaved: 'updated' },
          }),
        error: (error) => this.handleError(error),
      });
  }

  private loadAssessment(): void {
    this.courseService
      .getCourses({ page: 1, pageSize: 500 })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => {
          for (const course of response.items) {
            const found = course.assessments.find((a) => a.id === this.assessmentId);
            if (found) {
              this.applyAssessment({ ...found, courseId: course.id, courseTitle: course.title });
              return;
            }
          }
          this.assessmentFound.set(false);
          this.apiError.set('Assessment not found.');
        },
        error: (error) => {
          this.assessmentFound.set(false);
          this.apiError.set(getApiErrorMessage(error, 'Failed to load assessment.'));
        },
      });
  }

  private applyAssessment(assessment: AssessmentDto): void {
    this.assessment.set(assessment);
    this.assessmentFound.set(true);
    this.loading.set(false);
    this.form.patchValue({
      title: assessment.title,
      maxPoints: assessment.maxPoints,
      passRequirement: assessment.passRequirement,
      dueDate: toDateTimeLocalValue(assessment.dueDate),
      courseId: assessment.courseId ?? 0,
    });
  }

  private handleError(error: unknown): void {
    this.fieldErrors.set(getApiFieldErrors(error));
    this.apiError.set(getApiErrorMessage(error, 'Failed to update assessment.'));
  }
}
