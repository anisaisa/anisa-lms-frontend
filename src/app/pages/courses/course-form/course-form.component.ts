import { Component, input, output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { COURSE_STATUSES } from '../../../models/course-status';
import { UserListItem } from '../../../models/user.dto';
import { PageAlertComponent } from '../../../shared/components/page-alert/page-alert.component';
import { ApiFieldErrors, getFieldError } from '../../../shared/utils/api-error.util';

@Component({
  selector: 'app-course-form',
  imports: [ReactiveFormsModule, RouterLink, PageAlertComponent],
  templateUrl: './course-form.component.html',
})
export class CourseFormComponent {
  readonly form = input.required<FormGroup>();
  readonly instructors = input<UserListItem[]>([]);
  readonly loadingInstructors = input(false);
  readonly submitting = input(false);
  readonly apiError = input<string | null>(null);
  readonly fieldErrors = input<ApiFieldErrors>({});
  readonly heading = input('Course');
  readonly subtitle = input('');
  readonly submitLabel = input('Save course');

  readonly submitted = output<void>();

  protected readonly statuses = COURSE_STATUSES;

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
        return 'Must be at least 1.';
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
