import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { AssessmentScoreListItem } from '../../../models/assessment-score-list-item.dto';
import { AssessmentScoreService } from '../../../services/assessment-score.service';
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
  buildUpdateAssessmentScoreForm,
  toUpdateAssessmentScoreDto,
} from '../../../shared/utils/assessment-score-form.util';

@Component({
  selector: 'app-assessment-score-edit',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    PageAlertComponent,
    LoadingSpinnerComponent,
    ConfirmDialogComponent,
  ],
  templateUrl: './assessment-score-edit.component.html',
  styleUrl: './assessment-score-edit.component.css',
})
export class AssessmentScoreEditComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly assessmentScoreService = inject(AssessmentScoreService);

  protected readonly score = signal<AssessmentScoreListItem | null>(null);
  protected readonly loading = signal(true);
  protected readonly scoreFound = signal(false);
  protected readonly updating = signal(false);
  protected readonly deleting = signal(false);
  protected readonly deleteDialogOpen = signal(false);
  protected readonly apiError = signal<string | null>(null);
  protected readonly fieldErrors = signal<ApiFieldErrors>({});

  protected readonly scoreForm = buildUpdateAssessmentScoreForm(this.fb);

  private scoreId = 0;

  ngOnInit(): void {
    this.scoreId = Number(this.route.snapshot.paramMap.get('scoreId'));
    if (!this.scoreId || Number.isNaN(this.scoreId)) {
      this.apiError.set('Invalid assessment score.');
      this.loading.set(false);
      return;
    }

    const stateScore = history.state?.['score'] as AssessmentScoreListItem | undefined;
    if (stateScore?.id === this.scoreId) {
      this.applyScore(stateScore);
      return;
    }

    this.loading.set(false);
    this.scoreFound.set(false);
    this.apiError.set('Score not found. Open it from the assessment scores list.');
  }

  protected submitScoreUpdate(): void {
    this.apiError.set(null);
    this.fieldErrors.set({});

    if (this.scoreForm.invalid) {
      this.scoreForm.markAllAsTouched();
      return;
    }

    this.updating.set(true);
    this.assessmentScoreService
      .updateAssessmentScore(this.scoreId, toUpdateAssessmentScoreDto(this.scoreForm.getRawValue()))
      .pipe(finalize(() => this.updating.set(false)))
      .subscribe({
        next: () => {
          const updatedScore = Number(this.scoreForm.getRawValue().score);
          const current = this.score();
          if (current) {
            this.score.set({ ...current, score: updatedScore });
          }
          void this.router.navigate(['/assessment-scores'], {
            state: { scoreSaved: 'updated' },
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
    this.assessmentScoreService
      .deleteAssessmentScore(this.scoreId)
      .pipe(finalize(() => this.deleting.set(false)))
      .subscribe({
        next: () => {
          this.closeDeleteDialog();
          void this.router.navigate(['/assessment-scores'], {
            state: { scoreSaved: 'deleted' },
          });
        },
        error: (error) => {
          this.closeDeleteDialog();
          this.handleError(error);
        },
      });
  }

  protected deleteMessage(): string {
    const item = this.score();
    const name = item?.studentFullName ?? 'this student';
    const assessment = item?.assessmentTitle ?? 'the assessment';
    return `Delete score for "${name}" on "${assessment}"? This cannot be undone.`;
  }

  protected fieldError(fieldName: string): string | null {
    return getFieldError(this.fieldErrors(), fieldName);
  }

  private applyScore(item: AssessmentScoreListItem): void {
    this.score.set(item);
    this.scoreFound.set(true);
    this.loading.set(false);
    this.scoreForm.patchValue({ score: item.score });
  }

  private handleError(error: unknown): void {
    this.fieldErrors.set(getApiFieldErrors(error));
    this.apiError.set(getApiErrorMessage(error, 'Failed to update assessment score.'));
  }
}
