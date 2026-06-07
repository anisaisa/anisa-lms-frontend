import { Component, input, output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { AssessmentDto } from '../../../models/assessment.dto';
import { UserListItem } from '../../../models/user.dto';
import { PageAlertComponent } from '../../../shared/components/page-alert/page-alert.component';
import { ApiFieldErrors, getFieldError } from '../../../shared/utils/api-error.util';

@Component({
  selector: 'app-assessment-score-form',
  imports: [ReactiveFormsModule, RouterLink, PageAlertComponent],
  templateUrl: './assessment-score-form.component.html',
  styleUrl: './assessment-score-form.component.css',
})
export class AssessmentScoreFormComponent {
  readonly form = input.required<FormGroup>();
  readonly assessments = input<AssessmentDto[]>([]);
  readonly students = input<UserListItem[]>([]);
  readonly loadingAssessments = input(false);
  readonly loadingStudents = input(false);
  readonly submitting = input(false);
  readonly apiError = input<string | null>(null);
  readonly fieldErrors = input<ApiFieldErrors>({});
  readonly heading = input('Record assessment score');
  readonly subtitle = input<string | null>(null);
  readonly submitLabel = input('Create score');

  readonly submitted = output<void>();

  protected fieldError(fieldName: string): string | null {
    return getFieldError(this.fieldErrors(), fieldName);
  }

  protected onSubmit(): void {
    this.submitted.emit();
  }
}
