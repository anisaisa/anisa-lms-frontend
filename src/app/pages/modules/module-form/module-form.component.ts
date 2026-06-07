import { Component, input, output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { PageAlertComponent } from '../../../shared/components/page-alert/page-alert.component';
import { ApiFieldErrors, getFieldError } from '../../../shared/utils/api-error.util';

@Component({
  selector: 'app-module-form',
  imports: [ReactiveFormsModule, RouterLink, PageAlertComponent],
  templateUrl: './module-form.component.html',
  styleUrl: './module-form.component.css',
})
export class ModuleFormComponent {
  readonly form = input.required<FormGroup>();
  readonly courseId = input.required<number>();
  readonly courseTitle = input<string | null>(null);
  readonly mode = input<'create' | 'edit'>('create');
  readonly submitting = input(false);
  readonly apiError = input<string | null>(null);
  readonly fieldErrors = input<ApiFieldErrors>({});
  readonly heading = input('Module');
  readonly subtitle = input('');
  readonly submitLabel = input('Save module');

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
        return 'Must be 0 or greater.';
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
