import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { ProgressListItem } from '../../../models/progress-list-item.dto';
import { ProgressService } from '../../../services/progress.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { PageAlertComponent } from '../../../shared/components/page-alert/page-alert.component';
import {
  ApiFieldErrors,
  getApiErrorMessage,
  getApiFieldErrors,
  getFieldError,
} from '../../../shared/utils/api-error.util';
import {
  buildUpdateProgressForm,
  toDateTimeLocalValue,
  toUpdateProgressDto,
} from '../../../shared/utils/progress-form.util';
import { formatProgressCompletionLabel } from '../../../shared/utils/progress-list.util';

@Component({
  selector: 'app-progress-edit',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    PageAlertComponent,
    LoadingSpinnerComponent,
    ConfirmDialogComponent,
  ],
  templateUrl: './progress-edit.component.html',
  styleUrl: './progress-edit.component.css',
})
export class ProgressEditComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly progressService = inject(ProgressService);

  protected readonly item = signal<ProgressListItem | null>(null);
  protected readonly loading = signal(true);
  protected readonly itemFound = signal(false);
  protected readonly updating = signal(false);
  protected readonly deleting = signal(false);
  protected readonly deleteDialogOpen = signal(false);
  protected readonly apiError = signal<string | null>(null);
  protected readonly fieldErrors = signal<ApiFieldErrors>({});

  protected readonly progressForm = buildUpdateProgressForm(this.fb);

  private progressId = 0;

  ngOnInit(): void {
    this.progressId = Number(this.route.snapshot.paramMap.get('progressId'));
    if (!this.progressId || Number.isNaN(this.progressId)) {
      this.apiError.set('Invalid progress record.');
      this.loading.set(false);
      return;
    }

    const stateItem = history.state?.['progress'] as ProgressListItem | undefined;
    if (stateItem?.id === this.progressId) {
      this.applyItem(stateItem);
      return;
    }

    this.loading.set(false);
    this.itemFound.set(false);
    this.apiError.set('Progress record not found. Open it from the module progress list.');
  }

  protected submitUpdate(): void {
    this.apiError.set(null);
    this.fieldErrors.set({});

    if (this.progressForm.invalid) {
      this.progressForm.markAllAsTouched();
      return;
    }

    this.updating.set(true);
    this.progressService
      .updateProgress(this.progressId, toUpdateProgressDto(this.progressForm.getRawValue()))
      .pipe(finalize(() => this.updating.set(false)))
      .subscribe({
        next: () =>
          void this.router.navigate(['/progress'], {
            state: { progressSaved: 'updated' },
          }),
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
    this.progressService
      .deleteProgress(this.progressId)
      .pipe(finalize(() => this.deleting.set(false)))
      .subscribe({
        next: () => {
          this.closeDeleteDialog();
          void this.router.navigate(['/progress'], {
            state: { progressSaved: 'deleted' },
          });
        },
        error: (error) => {
          this.closeDeleteDialog();
          this.handleError(error);
        },
      });
  }

  protected deleteMessage(): string {
    const record = this.item();
    const student = record?.studentFullName ?? 'this student';
    const module = record?.moduleTitle ?? 'this module';
    return `Delete progress for "${student}" on "${module}"? This cannot be undone.`;
  }

  protected fieldError(fieldName: string): string | null {
    return getFieldError(this.fieldErrors(), fieldName);
  }

  protected formatCompletion(value: string | null): string {
    return formatProgressCompletionLabel(value);
  }

  private applyItem(record: ProgressListItem): void {
    this.item.set(record);
    this.itemFound.set(true);
    this.loading.set(false);
    this.progressForm.patchValue({
      isCompleted: record.isCompleted,
      completionDate: toDateTimeLocalValue(record.completionDate),
    });
  }

  private handleError(error: unknown): void {
    this.fieldErrors.set(getApiFieldErrors(error));
    this.apiError.set(getApiErrorMessage(error, 'Failed to update module progress.'));
  }
}
