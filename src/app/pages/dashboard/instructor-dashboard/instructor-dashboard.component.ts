import { Component, OnInit, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ChartData, ChartOptions } from 'chart.js';

import { InstructorDashboardDto } from '../../../models/instructor-dashboard.dto';
import { DashboardChartCardComponent } from '../../../shared/components/dashboard-chart-card/dashboard-chart-card.component';
import { DashboardCourseTableComponent } from '../../../shared/components/dashboard-course-table/dashboard-course-table.component';
import { DashboardKpiCardComponent } from '../../../shared/components/dashboard-kpi-card/dashboard-kpi-card.component';
import { formatAssessmentDueDate } from '../../../shared/utils/assessment.util';
import { buildInstructorCoursesChart } from '../../../shared/utils/dashboard-charts.util';

@Component({
  selector: 'app-instructor-dashboard',
  imports: [
    RouterLink,
    DashboardKpiCardComponent,
    DashboardCourseTableComponent,
    DashboardChartCardComponent,
  ],
  templateUrl: './instructor-dashboard.component.html',
  styleUrl: './instructor-dashboard.component.css',
})
export class InstructorDashboardComponent implements OnInit {
  readonly data = input.required<InstructorDashboardDto>();

  protected readonly coursesChartData = signal<ChartData<'bar'>>({ labels: [], datasets: [] });
  protected readonly coursesChartOptions = signal<ChartOptions<'bar'>>({});
  protected readonly enrolledChartData = signal<ChartData<'bar'>>({ labels: [], datasets: [] });

  ngOnInit(): void {
    const chart = buildInstructorCoursesChart(this.data().myCourses);
    this.coursesChartData.set(chart.data);
    this.coursesChartOptions.set(chart.options);

    this.enrolledChartData.set({
      labels: ['Students enrolled'],
      datasets: [
        {
          label: 'Students',
          data: [this.data().studentsEnrolled],
          backgroundColor: ['#7c3aed'],
          borderRadius: 8,
        },
      ],
    });
  }

  protected formatDueDate(value: string): string {
    return formatAssessmentDueDate(value);
  }

  protected isDueSoon(value: string): boolean {
    const due = new Date(value);
    if (Number.isNaN(due.getTime())) {
      return false;
    }
    const days = (due.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return days >= 0 && days <= 7;
  }

  protected hasCoursesChart(): boolean {
    return this.data().myCourses.length > 0;
  }
}
