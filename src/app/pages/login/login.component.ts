import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
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
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, PageAlertComponent],
  templateUrl: './login.component.html',
  styleUrls: ['../auth/auth-page.css', './login.component.css'],
})
export class LoginComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly submitting = signal(false);
  protected readonly apiError = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);
  protected readonly fieldErrors = signal<ApiFieldErrors>({});

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  ngOnInit(): void {
    if (this.route.snapshot.queryParamMap.get('registered') === 'true') {
      this.apiError.set(null);
      this.successMessage.set('Account created. Sign in with your email and password.');
    }
  }

  protected submit(): void {
    this.apiError.set(null);
    this.successMessage.set(null);
    this.fieldErrors.set({});

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);

    this.auth
      .login(this.form.getRawValue())
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () => {
          const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
          void this.router.navigateByUrl(this.auth.getPostLoginUrl(returnUrl));
        },
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
        return 'Password must be at least 8 characters.';
      }
    }

    return getFieldError(this.fieldErrors(), field);
  }

  private handleError(error: unknown): void {
    this.fieldErrors.set(getApiFieldErrors(error));
    this.apiError.set(getApiErrorMessage(error, 'Login failed. Please try again.'));
  }
}
