import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged, finalize } from 'rxjs';

import { EnrollmentDto } from '../../../models/enrollment.dto';
import {
  ENROLLMENT_STATUSES,
  ENROLLMENT_STATUS_LABELS,
  EnrollmentStatus,
} from '../../../models/enrollment-status';
import { EnrollmentService } from '../../../services/enrollment.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { ToastService } from '../../../shared/services/toast.service';
import { EnrollmentStatusBadgeComponent } from '../../../shared/components/enrollment-status-badge/enrollment-status-badge.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { PageAlertComponent } from '../../../shared/components/page-alert/page-alert.component';
import {
  ApiFieldErrors,
  getApiErrorMessage,
  getApiFieldErrors,
} from '../../../shared/utils/api-error.util';
import { filterEnrollments } from '../../../shared/utils/enrollment.util';

@Component({
  selector: 'app-enrollment-list',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    PageAlertComponent,
    LoadingSpinnerComponent,
    ConfirmDialogComponent,
    EnrollmentStatusBadgeComponent,
  ],
  templateUrl: './enrollment-list.component.html',
  styleUrl: './enrollment-list.component.css',
})
export class EnrollmentListComponent implements OnInit {
  private readonly enrollmentService = inject(EnrollmentService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  protected readonly loading = signal(true);
  protected readonly deleting = signal(false);
  protected readonly apiError = signal<string | null>(null);
  protected readonly fieldErrors = signal<ApiFieldErrors>({});

  protected readonly allEnrollments = signal<EnrollmentDto[]>([]);
  protected readonly deleteDialogOpen = signal(false);
  protected readonly enrollmentToDelete = signal<EnrollmentDto | null>(null);

  protected readonly searchControl = new FormControl('', { nonNullable: true });
  protected readonly statusFilterControl = new FormControl<'all' | EnrollmentStatus>('all', {
    nonNullable: true,
  });

  protected readonly searchQuery = signal('');
  protected readonly statusFilter = signal<'all' | EnrollmentStatus>('all');

  protected readonly statuses = ENROLLMENT_STATUSES;
  protected readonly statusLabels = ENROLLMENT_STATUS_LABELS;

  protected readonly filteredEnrollments = computed(() =>
    filterEnrollments(this.allEnrollments(), this.searchQuery(), this.statusFilter()),
  );

  ngOnInit(): void {
    this.applyNavigationMessage();
    this.loadEnrollments();

    this.searchControl.valueChanges
      .pipe(debounceTime(250), distinctUntilChanged())
      .subscribe((value) => this.searchQuery.set(value));

    this.statusFilterControl.valueChanges.subscribe((value) => this.statusFilter.set(value));
  }

  protected loadEnrollments(): void {
    this.loading.set(true);
    this.apiError.set(null);

    this.enrollmentService
      .getEnrollments()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (enrollments) => this.allEnrollments.set(enrollments),
        error: (error) => this.handleError(error),
      });
  }

  protected viewEnrollment(enrollment: EnrollmentDto): void {
    void this.router.navigate(['/enrollments', enrollment.id], {
      state: { enrollment },
    });
  }

  protected openDeleteDialog(enrollment: EnrollmentDto, event: MouseEvent): void {
    event.stopPropagation();
    this.enrollmentToDelete.set(enrollment);
    this.deleteDialogOpen.set(true);
  }

  protected closeDeleteDialog(): void {
    this.deleteDialogOpen.set(false);
    this.enrollmentToDelete.set(null);
  }

  protected confirmDelete(): void {
    const enrollment = this.enrollmentToDelete();
    if (!enrollment) {
      return;
    }

    this.deleting.set(true);
    this.enrollmentService
      .deleteEnrollment(enrollment.id)
      .pipe(finalize(() => this.deleting.set(false)))
      .subscribe({
        next: () => {
          this.closeDeleteDialog();
          this.toast.success('Enrollment deleted successfully.');
          this.loadEnrollments();
        },
        error: (error) => {
          this.closeDeleteDialog();
          this.handleError(error);
        },
      });
  }

  protected deleteMessage(): string {
    const name = this.enrollmentToDelete()?.studentFullName ?? 'this student';
    const course = this.enrollmentToDelete()?.courseTitle ?? 'this course';
    return `Delete enrollment for "${name}" in "${course}"? This cannot be undone.`;
  }

  protected statusFilterValue(status: EnrollmentStatus): EnrollmentStatus {
    return status;
  }

  private applyNavigationMessage(): void {
    const saved = history.state?.['enrollmentSaved'] as string | undefined;
    if (saved === 'created') {
      this.toast.success('Enrollment created successfully.');
    } else if (saved === 'updated') {
      this.toast.success('Enrollment updated successfully.');
    } else if (saved === 'deleted') {
      this.toast.success('Enrollment deleted successfully.');
    }
  }

  private handleError(error: unknown): void {
    this.fieldErrors.set(getApiFieldErrors(error));
    this.apiError.set(getApiErrorMessage(error, 'Failed to load enrollments.'));
  }
}
