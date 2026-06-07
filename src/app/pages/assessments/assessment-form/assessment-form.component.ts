import { Component, input, output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { CourseDto } from '../../../models/course.dto';
import { PageAlertComponent } from '../../../shared/components/page-alert/page-alert.component';
import { ApiFieldErrors, getFieldError } from '../../../shared/utils/api-error.util';

@Component({
  selector: 'app-assessment-form',
  imports: [ReactiveFormsModule, RouterLink, PageAlertComponent],
  templateUrl: './assessment-form.component.html',
  styleUrls: ['../assessments-page.css'],
})
export class AssessmentFormComponent {
  readonly form = input.required<FormGroup>();
  readonly courses = input<CourseDto[]>([]);
  readonly loadingCourses = input(false);
  readonly showCourseSelect = input(true);
  readonly courseTitle = input<string | null>(null);
  readonly submitting = input(false);
  readonly apiError = input<string | null>(null);
  readonly fieldErrors = input<ApiFieldErrors>({});
  readonly heading = input('Assessment');
  readonly subtitle = input('');
  readonly submitLabel = input('Save assessment');

  readonly submitted = output<void>();

  protected fieldError(field: string): string | null {
    const control = this.form().get(field);
    if (control?.touched && control.invalid) {
      if (control.hasError('required')) {
        return 'This field is required.';
      }
      if (control.hasError('minlength')) {
        return `Must be at least ${control.getError('minlength')?.requiredLength} characters.`;
      }
      if (control.hasError('min')) {
        return 'Value is too low.';
      }
    }

    const apiField = field.charAt(0).toUpperCase() + field.slice(1);
    return (
      getFieldError(this.fieldErrors(), field) ?? getFieldError(this.fieldErrors(), apiField)
    );
  }

  protected onSubmit(): void {
    this.submitted.emit();
  }
}
