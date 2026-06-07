import { Component, OnChanges, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { StudentModuleProgressDto } from '../../../models/student-module-progress.dto';
import { ProgressService } from '../../../services/progress.service';
import { PageAlertComponent } from '../page-alert/page-alert.component';
import { buildMarkProgressForm } from '../../utils/mark-progress-form.util';
import { getApiErrorMessage } from '../../utils/api-error.util';
import { formatCompletionDate } from '../../utils/progress.util';

@Component({
  selector: 'app-mark-module-complete',
  imports: [ReactiveFormsModule, PageAlertComponent],
  templateUrl: './mark-module-complete.component.html',
  styleUrl: './mark-module-complete.component.css',
})
export class MarkModuleCompleteComponent implements OnChanges {
  private readonly fb = inject(FormBuilder);
  private readonly progressService = inject(ProgressService);

  readonly studentId = input.required<string>();
  readonly moduleId = input.required<number>();
  readonly isLocked = input(false);
  readonly progress = input<StudentModuleProgressDto | null>(null);
  readonly compact = input(false);

  readonly progressChanged = output<void>();

  protected readonly form = buildMarkProgressForm(this.fb);
  protected readonly submitting = signal(false);
  protected readonly apiError = signal<string | null>(null);

  protected completionLabel(): string | null {
    return formatCompletionDate(this.progress()?.completionDate ?? null);
  }

  ngOnChanges(): void {
    const entry = this.progress();
    this.form.patchValue({ isCompleted: entry?.isCompleted ?? false }, { emitEvent: false });
    if (entry?.isCompleted) {
      this.form.disable({ emitEvent: false });
    } else if (!this.isLocked()) {
      this.form.enable({ emitEvent: false });
    }
  }

  protected submit(): void {
    if (this.isLocked()) {
      this.apiError.set('This module is locked. Complete the previous module first.');
      return;
    }

    if (this.progress()?.isCompleted) {
      return;
    }

    if (this.form.invalid || !this.form.value.isCompleted) {
      this.form.markAllAsTouched();
      return;
    }

    this.apiError.set(null);
    this.submitting.set(true);

    const existing = this.progress();
    const request$ = existing
      ? this.progressService.updateProgress(existing.id, { isCompleted: true })
      : this.progressService.createProgress({
          studentId: this.studentId(),
          moduleId: this.moduleId(),
          isCompleted: true,
        });

    request$.pipe(finalize(() => this.submitting.set(false))).subscribe({
      next: () => this.progressChanged.emit(),
      error: (error) =>
        this.apiError.set(getApiErrorMessage(error, 'Failed to update progress.')),
    });
  }
}
