import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { EnrollmentDto } from '../../../models/enrollment.dto';
import {
  ENROLLMENT_STATUSES,
  ENROLLMENT_STATUS_LABELS,
  EnrollmentStatus,
} from '../../../models/enrollment-status';
import { EnrollmentService } from '../../../services/enrollment.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { EnrollmentStatusBadgeComponent } from '../../../shared/components/enrollment-status-badge/enrollment-status-badge.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { PageAlertComponent } from '../../../shared/components/page-alert/page-alert.component';
import {
  ApiFieldErrors,
  getApiErrorMessage,
  getApiFieldErrors,
  getFieldError,
} from '../../../shared/utils/api-error.util';
import {
  buildUpdateEnrollmentStatusForm,
  toUpdateEnrollmentDto,
} from '../../../shared/utils/enrollment-form.util';

@Component({
  selector: 'app-enrollment-details',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    PageAlertComponent,
    LoadingSpinnerComponent,
    ConfirmDialogComponent,
    EnrollmentStatusBadgeComponent,
  ],
  templateUrl: './enrollment-details.component.html',
  styleUrl: './enrollment-details.component.css',
})
export class EnrollmentDetailsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly enrollmentService = inject(EnrollmentService);

  protected readonly enrollment = signal<EnrollmentDto | null>(null);
  protected readonly loading = signal(true);
  protected readonly enrollmentFound = signal(false);
  protected readonly updating = signal(false);
  protected readonly deleting = signal(false);
  protected readonly deleteDialogOpen = signal(false);
  protected readonly apiError = signal<string | null>(null);
  protected readonly fieldErrors = signal<ApiFieldErrors>({});

  protected readonly statuses = ENROLLMENT_STATUSES;
  protected readonly statusLabels = ENROLLMENT_STATUS_LABELS;

  protected readonly statusForm = buildUpdateEnrollmentStatusForm(this.fb);

  private enrollmentId = 0;

  ngOnInit(): void {
    this.enrollmentId = Number(this.route.snapshot.paramMap.get('enrollmentId'));
    if (!this.enrollmentId || Number.isNaN(this.enrollmentId)) {
      this.apiError.set('Invalid enrollment.');
      this.loading.set(false);
      return;
    }

    const stateEnrollment = history.state?.['enrollment'] as EnrollmentDto | undefined;
    if (stateEnrollment?.id === this.enrollmentId) {
      this.applyEnrollment(stateEnrollment);
      return;
    }

    this.loadEnrollment();
  }

  protected submitStatusUpdate(): void {
    this.apiError.set(null);
    this.fieldErrors.set({});

    if (this.statusForm.invalid) {
      this.statusForm.markAllAsTouched();
      return;
    }

    this.updating.set(true);
    this.enrollmentService
      .updateEnrollment(this.enrollmentId, toUpdateEnrollmentDto(this.statusForm.getRawValue()))
      .pipe(finalize(() => this.updating.set(false)))
      .subscribe({
        next: () => {
          const updatedStatus = this.statusForm.getRawValue().status;
          const current = this.enrollment();
          if (current) {
            this.enrollment.set({ ...current, status: updatedStatus });
          }
          void this.router.navigate(['/enrollments'], {
            state: { enrollmentSaved: 'updated' },
          });
        },
        error: (error) => this.handleError(error),
      });
  }

  protected openDeleteDialog(): void {
    this.deleteDialogOpen.set(true);
  }

  protected closeDeleteDialog(): void {
    this.deleteDialogOpen.set(false);
  }

  protected confirmDelete(): void {
    this.deleting.set(true);
    this.enrollmentService
      .deleteEnrollment(this.enrollmentId)
      .pipe(finalize(() => this.deleting.set(false)))
      .subscribe({
        next: () => {
          this.closeDeleteDialog();
          void this.router.navigate(['/enrollments'], {
            state: { enrollmentSaved: 'deleted' },
          });
        },
        error: (error) => {
          this.closeDeleteDialog();
          this.handleError(error);
        },
      });
  }

  protected deleteMessage(): string {
    const name = this.enrollment()?.studentFullName ?? 'this student';
    const course = this.enrollment()?.courseTitle ?? 'this course';
    return `Remove enrollment for "${name}" in "${course}"? This cannot be undone.`;
  }

  protected fieldError(fieldName: string): string | null {
    return getFieldError(this.fieldErrors(), fieldName);
  }

  protected statusValue(status: EnrollmentStatus): EnrollmentStatus {
    return status;
  }

  private loadEnrollment(): void {
    this.enrollmentService
      .getEnrollmentById(this.enrollmentId)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (enrollment) => this.applyEnrollment(enrollment),
        error: (error) => {
          this.enrollmentFound.set(false);
          this.apiError.set(getApiErrorMessage(error, 'Failed to load enrollment.'));
        },
      });
  }

  private applyEnrollment(enrollment: EnrollmentDto): void {
    this.enrollment.set(enrollment);
    this.enrollmentFound.set(true);
    this.loading.set(false);
    this.statusForm.patchValue({ status: enrollment.status });
  }

  private handleError(error: unknown): void {
    this.fieldErrors.set(getApiFieldErrors(error));
    this.apiError.set(getApiErrorMessage(error, 'Failed to update enrollment.'));
  }
}
