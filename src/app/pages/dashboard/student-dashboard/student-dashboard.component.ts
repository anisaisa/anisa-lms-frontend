import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ChartData, ChartOptions } from 'chart.js';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize, map } from 'rxjs';

import { StudentDashboardDto } from '../../../models/student-dashboard.dto';
import { AuthService } from '../../../services/auth.service';
import { ModuleService } from '../../../services/module.service';
import { ProgressService } from '../../../services/progress.service';
import { DashboardChartCardComponent } from '../../../shared/components/dashboard-chart-card/dashboard-chart-card.component';
import { CourseProgressSummaryComponent } from '../../../shared/components/course-progress-summary/course-progress-summary.component';
import { DashboardKpiCardComponent } from '../../../shared/components/dashboard-kpi-card/dashboard-kpi-card.component';
import {
  CourseProgressStats,
  computeCourseProgressStats,
} from '../../../shared/utils/progress.util';
import {
  buildModuleProgressChart,
  buildStudentAssessmentsChart,
} from '../../../shared/utils/dashboard-charts.util';

@Component({
  selector: 'app-student-dashboard',
  imports: [
    RouterLink,
    DashboardKpiCardComponent,
    CourseProgressSummaryComponent,
    DashboardChartCardComponent,
  ],
  templateUrl: './student-dashboard.component.html',
  styleUrl: './student-dashboard.component.css',
})
export class StudentDashboardComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly moduleService = inject(ModuleService);
  private readonly progressService = inject(ProgressService);

  readonly data = input.required<StudentDashboardDto>();

  protected readonly progressLoading = signal(true);
  protected readonly aggregateStats = signal<CourseProgressStats>({
    totalModules: 0,
    completedModules: 0,
    remainingModules: 0,
    progressPercent: 0,
    isCourseCompleted: false,
  });

  protected readonly progressChartData = signal<ChartData<'doughnut'>>({
    labels: [],
    datasets: [],
  });
  protected readonly progressChartOptions = signal<ChartOptions<'doughnut'>>({});
  protected readonly assessmentsChartData = signal<ChartData<'bar'>>({ labels: [], datasets: [] });
  protected readonly assessmentsChartOptions = signal<ChartOptions<'bar'>>({});

  protected readonly hasProgressChart = computed(
    () => this.aggregateStats().totalModules > 0,
  );

  ngOnInit(): void {
    this.initAssessmentsChart();
    this.loadProgress();
  }

  private initAssessmentsChart(): void {
    const chart = buildStudentAssessmentsChart(
      this.data().completedAssessments,
      this.data().totalEnrollments,
    );
    this.assessmentsChartData.set(chart.data);
    this.assessmentsChartOptions.set(chart.options);
  }

  private loadProgress(): void {
    const user = this.auth.currentUser;
    const courseIds = this.data().coursesInProgress.map((course) => course.id);

    if (!user?.id || !courseIds.length) {
      this.applyProgressStats({
        totalModules: 0,
        completedModules: this.data().modulesCompleted,
        remainingModules: 0,
        progressPercent: 0,
        isCourseCompleted: false,
      });
      this.progressLoading.set(false);
      return;
    }

    this.progressLoading.set(true);
    const requests = courseIds.map((courseId) =>
      forkJoin({
        modules: this.moduleService.getModulesForCourse(courseId, user.id),
        progress: this.progressService.getProgress(user.id, courseId),
      }).pipe(
        map(({ modules, progress }) => computeCourseProgressStats(modules, progress)),
        catchError(() =>
          of({
            totalModules: 0,
            completedModules: 0,
            remainingModules: 0,
            progressPercent: 0,
            isCourseCompleted: false,
          }),
        ),
      ),
    );

    forkJoin(requests)
      .pipe(finalize(() => this.progressLoading.set(false)))
      .subscribe((statsList) => {
        const totalModules = statsList.reduce((sum, item) => sum + item.totalModules, 0);
        const completedModules = statsList.reduce((sum, item) => sum + item.completedModules, 0);
        const remainingModules = Math.max(totalModules - completedModules, 0);
        const progressPercent =
          totalModules === 0 ? 0 : Math.round((completedModules / totalModules) * 100);

        this.applyProgressStats({
          totalModules,
          completedModules,
          remainingModules,
          progressPercent,
          isCourseCompleted:
            totalModules > 0 && statsList.every((item) => item.isCourseCompleted),
        });
      });
  }

  private applyProgressStats(stats: CourseProgressStats): void {
    this.aggregateStats.set(stats);
    const chart = buildModuleProgressChart(stats.completedModules, stats.totalModules);
    this.progressChartData.set(chart.data);
    this.progressChartOptions.set(chart.options);
  }
}
