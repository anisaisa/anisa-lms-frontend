import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { catchError, finalize, forkJoin, map, of, switchMap } from 'rxjs';

import { AssessmentScoreListItem } from '../../../models/assessment-score-list-item.dto';
import { AssessmentService } from '../../../services/assessment.service';
import { AssessmentScoreService } from '../../../services/assessment-score.service';
import { CourseService } from '../../../services/course.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { PageAlertComponent } from '../../../shared/components/page-alert/page-alert.component';
import { ToastService } from '../../../shared/services/toast.service';
import {
  ApiFieldErrors,
  getApiErrorMessage,
  getApiFieldErrors,
} from '../../../shared/utils/api-error.util';
import {
  filterAssessmentScores,
  toAssessmentScoreListItem,
} from '../../../shared/utils/assessment-score.util';
import { extractAssessmentsFromCourses } from '../../../shared/utils/assessment.util';

@Component({
  selector: 'app-assessment-score-list',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    PageAlertComponent,
    LoadingSpinnerComponent,
    ConfirmDialogComponent,
  ],
  templateUrl: './assessment-score-list.component.html',
  styleUrl: './assessment-score-list.component.css',
})
export class AssessmentScoreListComponent implements OnInit {
  private readonly courseService = inject(CourseService);
  private readonly assessmentService = inject(AssessmentService);
  private readonly assessmentScoreService = inject(AssessmentScoreService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  protected readonly loading = signal(true);
  protected readonly deleting = signal(false);
  protected readonly apiError = signal<string | null>(null);
  protected readonly fieldErrors = signal<ApiFieldErrors>({});

  protected readonly allScores = signal<AssessmentScoreListItem[]>([]);
  protected readonly deleteDialogOpen = signal(false);
  protected readonly scoreToDelete = signal<AssessmentScoreListItem | null>(null);

  protected readonly searchControl = new FormControl('', { nonNullable: true });
  protected readonly searchQuery = signal('');

  protected readonly filteredScores = computed(() =>
    filterAssessmentScores(this.allScores(), this.searchQuery()),
  );

  ngOnInit(): void {
    this.applyNavigationMessage();
    this.loadScores();
  }

  protected onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchControl.setValue(value, { emitEvent: false });
    this.searchQuery.set(value);
  }

  protected loadScores(): void {
    this.loading.set(true);
    this.apiError.set(null);

    this.courseService
      .getCourses({ page: 1, pageSize: 500 })
      .pipe(
        switchMap((response) => {
          const assessments = extractAssessmentsFromCourses(response.items);
          if (!assessments.length) {
            return of([] as AssessmentScoreListItem[]);
          }

          return forkJoin(
            assessments.map((assessment) =>
              forkJoin({
                passed: this.assessmentService
                  .getResults(assessment.id, true)
                  .pipe(catchError(() => of([]))),
                failed: this.assessmentService
                  .getResults(assessment.id, false)
                  .pipe(catchError(() => of([]))),
              }).pipe(
                map(({ passed, failed }) => {
                  const combined = [...passed, ...failed];
                  return combined.map((score) => toAssessmentScoreListItem(score, assessment));
                }),
                catchError(() => of([] as AssessmentScoreListItem[])),
              ),
            ),
          ).pipe(map((groups) => groups.flat().sort((a, b) => a.id - b.id)));
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: (scores) => this.allScores.set(scores),
        error: (error) => this.handleError(error),
      });
  }

  protected editScore(score: AssessmentScoreListItem): void {
    void this.router.navigate(['/assessment-scores', score.id, 'edit'], {
      state: { score },
    });
  }

  protected openDeleteDialog(score: AssessmentScoreListItem, event: MouseEvent): void {
    event.stopPropagation();
    this.scoreToDelete.set(score);
    this.deleteDialogOpen.set(true);
  }

  protected closeDeleteDialog(): void {
    this.deleteDialogOpen.set(false);
    this.scoreToDelete.set(null);
  }

  protected confirmDelete(): void {
    const score = this.scoreToDelete();
    if (!score) {
      return;
    }

    this.deleting.set(true);
    this.assessmentScoreService
      .deleteAssessmentScore(score.id)
      .pipe(finalize(() => this.deleting.set(false)))
      .subscribe({
        next: () => {
          this.closeDeleteDialog();
          this.toast.success('Assessment score deleted successfully.');
          this.loadScores();
        },
        error: (error) => {
          this.closeDeleteDialog();
          this.handleError(error);
        },
      });
  }

  protected deleteMessage(): string {
    const item = this.scoreToDelete();
    const name = item?.studentFullName ?? 'this student';
    const assessment = item?.assessmentTitle ?? 'the assessment';
    return `Delete score for "${name}" on "${assessment}"? This cannot be undone.`;
  }

  private applyNavigationMessage(): void {
    const saved = history.state?.['scoreSaved'] as string | undefined;
    if (saved === 'created') {
      this.toast.success('Assessment score created successfully.');
    } else if (saved === 'updated') {
      this.toast.success('Assessment score updated successfully.');
    } else if (saved === 'deleted') {
      this.toast.success('Assessment score deleted successfully.');
    }
  }

  private handleError(error: unknown): void {
    this.fieldErrors.set(getApiFieldErrors(error));
    this.apiError.set(getApiErrorMessage(error, 'Failed to load assessment scores.'));
  }
}
