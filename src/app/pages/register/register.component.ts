import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { PageAlertComponent } from '../../shared/components/page-alert/page-alert.component';
import {
  ApiFieldErrors,
  getApiErrorMessage,
  getApiFieldErrors,
  getFieldError,
} from '../../shared/utils/api-error.util';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink, PageAlertComponent],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly submitting = signal(false);
  protected readonly apiError = signal<string | null>(null);
  protected readonly fieldErrors = signal<ApiFieldErrors>({});

  protected readonly form = this.fb.nonNullable.group({
    fullName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  protected submit(): void {
    this.apiError.set(null);
    this.fieldErrors.set({});

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);

    this.auth
      .register(this.form.getRawValue())
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () =>
          void this.router.navigate(['/login'], {
            queryParams: { registered: 'true' },
          }),
        error: (error) => this.handleError(error),
      });
  }

  protected fieldError(field: string): string | null {
    const control = this.form.get(field);
    if (control?.touched && control.invalid) {
      if (control.hasError('required')) {
        return 'This field is required.';
      }
      if (control.hasError('email')) {
        return 'Enter a valid email address.';
      }
      if (control.hasError('minlength')) {
        const min = control.getError('minlength')?.requiredLength;
        if (field === 'password') {
          return `Password must be at least ${min} characters.`;
        }
        return `Must be at least ${min} characters.`;
      }
    }

    const apiField =
      field === 'fullName' ? 'FullName' : field.charAt(0).toUpperCase() + field.slice(1);
    return getFieldError(this.fieldErrors(), field) ?? getFieldError(this.fieldErrors(), apiField);
  }

  private handleError(error: unknown): void {
    this.fieldErrors.set(getApiFieldErrors(error));
    this.apiError.set(getApiErrorMessage(error, 'Registration failed. Please try again.'));
  }
}
