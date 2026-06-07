import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter, finalize, map, skip, Subscription } from 'rxjs';

import { AssessmentScoreListItem } from '../../../models/assessment-score-list-item.dto';
import { AssessmentDto } from '../../../models/assessment.dto';
import { AssessmentScoreDto } from '../../../models/assessment-score.dto';
import { AssessmentService } from '../../../services/assessment.service';
import { AssessmentScoreService } from '../../../services/assessment-score.service';
import { CourseService } from '../../../services/course.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { PageAlertComponent } from '../../../shared/components/page-alert/page-alert.component';
import { ToastService } from '../../../shared/services/toast.service';
import { toAssessmentScoreListItem } from '../../../shared/utils/assessment-score.util';
import { extractAssessmentsFromCourses, formatAssessmentDueDate } from '../../../shared/utils/assessment.util';
import { getApiErrorMessage } from '../../../shared/utils/api-error.util';

@Component({
  selector: 'app-assessment-results',
  imports: [RouterLink, PageAlertComponent, LoadingSpinnerComponent, ConfirmDialogComponent],
  templateUrl: './assessment-results.component.html',
  styleUrl: './assessment-results.component.css',
})
export class AssessmentResultsComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly assessmentService = inject(AssessmentService);
  private readonly assessmentScoreService = inject(AssessmentScoreService);
  private readonly courseService = inject(CourseService);
  private readonly toast = inject(ToastService);
  private routerSubscription?: Subscription;

  protected readonly assessmentId = Number(this.route.snapshot.paramMap.get('assessmentId'));
  protected readonly assessment = signal<AssessmentDto | null>(null);
  protected readonly results = signal<AssessmentScoreDto[]>([]);
  protected readonly loading = signal(true);
  protected readonly deleting = signal(false);
  protected readonly apiError = signal<string | null>(null);
  protected readonly filterPassed = signal(true);
  protected readonly deleteDialogOpen = signal(false);
  protected readonly scoreToDelete = signal<AssessmentScoreDto | null>(null);

  ngOnInit(): void {
    if (!this.assessmentId || Number.isNaN(this.assessmentId)) {
      this.apiError.set('Invalid assessment.');
      this.loading.set(false);
      return;
    }

    const stateAssessment = history.state?.['assessment'] as AssessmentDto | undefined;
    if (stateAssessment?.id === this.assessmentId) {
      this.assessment.set(stateAssessment);
    } else {
      this.loadAssessmentMetadata();
    }

    this.applyNavigationMessage();
    this.loadResults();

    this.routerSubscription = this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        skip(1),
      )
      .subscribe(() => {
        if (this.route.snapshot.paramMap.get('assessmentId') === String(this.assessmentId)) {
          this.loadResults();
        }
      });
  }

  ngOnDestroy(): void {
    this.routerSubscription?.unsubscribe();
  }

  protected setFilter(passed: boolean): void {
    if (this.filterPassed() === passed) {
      return;
    }
    this.filterPassed.set(passed);
    this.loadResults();
  }

  protected formatDueDate(value: string): string {
    return formatAssessmentDueDate(value);
  }

  protected editScore(row: AssessmentScoreDto): void {
    const assessment = this.assessment();
    if (!assessment) {
      return;
    }

    const score = toAssessmentScoreListItem(row, assessment);
    void this.router.navigate(['/assessment-scores', score.id, 'edit'], {
      state: { score },
    });
  }

  protected openDeleteDialog(row: AssessmentScoreDto): void {
    this.scoreToDelete.set(row);
    this.deleteDialogOpen.set(true);
  }

  protected closeDeleteDialog(): void {
    this.deleteDialogOpen.set(false);
    this.scoreToDelete.set(null);
  }

  protected confirmDelete(): void {
    const row = this.scoreToDelete();
    if (!row) {
      return;
    }

    this.deleting.set(true);
    this.assessmentScoreService
      .deleteAssessmentScore(row.id)
      .pipe(finalize(() => this.deleting.set(false)))
      .subscribe({
        next: () => {
          this.closeDeleteDialog();
          this.toast.success('Assessment score deleted successfully.');
          this.loadResults();
        },
        error: (error) => {
          this.closeDeleteDialog();
          this.apiError.set(getApiErrorMessage(error, 'Failed to delete assessment score.'));
        },
      });
  }

  protected deleteMessage(): string {
    const name = this.scoreToDelete()?.studentFullName ?? 'this student';
    return `Delete score for "${name}"? This cannot be undone.`;
  }

  private loadResults(): void {
    this.loading.set(true);
    this.apiError.set(null);

    this.assessmentService
      .getResults(this.assessmentId, this.filterPassed())
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (items) => this.results.set(items),
        error: (error) =>
          this.apiError.set(getApiErrorMessage(error, 'Failed to load assessment results.')),
      });
  }

  private loadAssessmentMetadata(): void {
    this.courseService
      .getCourses({ page: 1, pageSize: 500 })
      .pipe(
        map((response) => extractAssessmentsFromCourses(response.items)),
        map((assessments) => assessments.find((item) => item.id === this.assessmentId) ?? null),
      )
      .subscribe({
        next: (assessment) => {
          if (assessment) {
            this.assessment.set(assessment);
          }
        },
      });
  }

  private applyNavigationMessage(): void {
    const saved = history.state?.['scoreSaved'] as string | undefined;
    if (saved === 'created') {
      this.toast.success('Assessment score created successfully.');
    }
  }
}
