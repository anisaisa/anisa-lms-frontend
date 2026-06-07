import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';

import { AssessmentDto } from '../../../models/assessment.dto';
import { UserListItem } from '../../../models/user.dto';
import { AssessmentScoreService } from '../../../services/assessment-score.service';
import { CourseService } from '../../../services/course.service';
import { UserService } from '../../../services/user.service';
import {
  ApiFieldErrors,
  getApiErrorMessage,
  getApiFieldErrors,
} from '../../../shared/utils/api-error.util';
import {
  buildCreateAssessmentScoreForm,
  toCreateAssessmentScoreDto,
} from '../../../shared/utils/assessment-score-form.util';
import { extractAssessmentsFromCourses } from '../../../shared/utils/assessment.util';
import { AssessmentScoreFormComponent } from '../assessment-score-form/assessment-score-form.component';

@Component({
  selector: 'app-assessment-score-create',
  imports: [AssessmentScoreFormComponent],
  template: `
    <app-assessment-score-form
      [form]="form"
      [assessments]="assessments()"
      [students]="students()"
      [loadingAssessments]="loadingAssessments()"
      [loadingStudents]="loadingStudents()"
      [submitting]="submitting()"
      [apiError]="apiError()"
      [fieldErrors]="fieldErrors()"
      heading="Record assessment score"
      subtitle="Assign a score to a student for an assessment."
      submitLabel="Create score"
      (submitted)="submit()"
    />
  `,
})
export class AssessmentScoreCreateComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly assessmentScoreService = inject(AssessmentScoreService);
  private readonly courseService = inject(CourseService);
  private readonly userService = inject(UserService);

  protected readonly form = buildCreateAssessmentScoreForm(this.fb);
  protected readonly assessments = signal<AssessmentDto[]>([]);
  protected readonly students = signal<UserListItem[]>([]);
  protected readonly loadingAssessments = signal(false);
  protected readonly loadingStudents = signal(false);
  protected readonly submitting = signal(false);
  protected readonly apiError = signal<string | null>(null);
  protected readonly fieldErrors = signal<ApiFieldErrors>({});

  ngOnInit(): void {
    const assessmentId = Number(this.route.snapshot.queryParamMap.get('assessmentId'));
    if (assessmentId && !Number.isNaN(assessmentId)) {
      this.form.patchValue({ assessmentId });
    }
    this.loadAssessments();
    this.loadStudents();
  }

  protected submit(): void {
    this.apiError.set(null);
    this.fieldErrors.set({});

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const assessmentId = Number(raw.assessmentId);

    this.submitting.set(true);
    this.assessmentScoreService
      .createAssessmentScore(toCreateAssessmentScoreDto(raw))
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () => {
          if (assessmentId && !Number.isNaN(assessmentId)) {
            const assessment = this.assessments().find((item) => item.id === assessmentId);
            void this.router.navigate(['/assessments', assessmentId, 'results'], {
              state: { assessment, scoreSaved: 'created' },
            });
            return;
          }

          void this.router.navigate(['/assessment-scores'], {
            state: { scoreSaved: 'created' },
          });
        },
        error: (error) => this.handleError(error),
      });
  }

  private loadAssessments(): void {
    this.loadingAssessments.set(true);
    this.courseService
      .getCourses({ page: 1, pageSize: 500 })
      .pipe(finalize(() => this.loadingAssessments.set(false)))
      .subscribe({
        next: (response) => this.assessments.set(extractAssessmentsFromCourses(response.items)),
        error: (error) =>
          this.apiError.set(getApiErrorMessage(error, 'Failed to load assessments.')),
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
    this.apiError.set(getApiErrorMessage(error, 'Failed to create assessment score.'));
  }
}
