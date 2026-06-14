import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ChartData, ChartOptions } from 'chart.js';
import { forkJoin, finalize } from 'rxjs';

import { AdminDashboardDto } from '../../../models/admin-dashboard.dto';
import { User } from '../../../models/user.model';
import { EnrollmentService } from '../../../services/enrollment.service';
import { UserService } from '../../../services/user.service';
import { DashboardChartCardComponent } from '../../../shared/components/dashboard-chart-card/dashboard-chart-card.component';
import { DashboardCourseTableComponent } from '../../../shared/components/dashboard-course-table/dashboard-course-table.component';
import { DashboardKpiCardComponent } from '../../../shared/components/dashboard-kpi-card/dashboard-kpi-card.component';
import { UserRoleBadgeComponent } from '../../../shared/components/user-role-badge/user-role-badge.component';
import {
  buildCoursesByEnrollmentChart,
  buildEnrollmentStatusChart,
  buildUsersByRoleChart,
} from '../../../shared/utils/dashboard-charts.util';

@Component({
  selector: 'app-admin-dashboard',
  imports: [
    RouterLink,
    DashboardKpiCardComponent,
    DashboardCourseTableComponent,
    UserRoleBadgeComponent,
    DashboardChartCardComponent,
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css',
})
export class AdminDashboardComponent implements OnInit {
  private readonly userService = inject(UserService);
  private readonly enrollmentService = inject(EnrollmentService);
  private readonly router = inject(Router);

  readonly data = input.required<AdminDashboardDto>();

  protected readonly recentUsers = signal<User[]>([]);
  protected readonly allUsers = signal<User[]>([]);
  protected readonly totalEnrollments = signal(0);
  protected readonly loadingChartData = signal(true);

  protected readonly coursesChartData = signal<ChartData<'bar'>>({ labels: [], datasets: [] });
  protected readonly coursesChartOptions = signal<ChartOptions<'bar'>>({});
  protected readonly usersChartData = signal<ChartData<'pie'>>({ labels: [], datasets: [] });
  protected readonly usersChartOptions = signal<ChartOptions<'pie'>>({});
  protected readonly enrollmentChartData = signal<ChartData<'doughnut'>>({ labels: [], datasets: [] });
  protected readonly enrollmentChartOptions = signal<ChartOptions<'doughnut'>>({});

  protected readonly hasCoursesChart = computed(
    () => (this.coursesChartData().datasets[0]?.data?.length ?? 0) > 0,
  );
  protected readonly hasUsersChart = computed(() => this.allUsers().length > 0);
  protected readonly hasEnrollmentChart = computed(() =>
    this.enrollmentChartData().datasets.some((dataset) =>
      (dataset.data as number[]).some((value) => value > 0),
    ),
  );

  ngOnInit(): void {
    this.initCourseChart();
    this.loadChartData();
    this.loadRecentUsers();
  }

  protected viewUser(user: User): void {
    void this.router.navigate(['/users', user.id], { state: { user } });
  }

  protected initials(fullName: string): string {
    const parts = fullName.trim().split(/\s+/).filter(Boolean);
    if (!parts.length) {
      return '?';
    }
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }

  private initCourseChart(): void {
    const chart = buildCoursesByEnrollmentChart(this.data().popularCourses);
    this.coursesChartData.set(chart.data);
    this.coursesChartOptions.set(chart.options);
  }

  private loadChartData(): void {
    this.loadingChartData.set(true);
    forkJoin({
      users: this.userService.getUsers(),
      enrollments: this.enrollmentService.getEnrollments(),
    })
      .pipe(finalize(() => this.loadingChartData.set(false)))
      .subscribe({
        next: ({ users, enrollments }) => {
          this.allUsers.set(users);
          this.totalEnrollments.set(enrollments.length);
          const usersChart = buildUsersByRoleChart(users);
          this.usersChartData.set(usersChart.data);
          this.usersChartOptions.set(usersChart.options);

          const enrollmentChart = buildEnrollmentStatusChart(enrollments);
          this.enrollmentChartData.set(enrollmentChart.data);
          this.enrollmentChartOptions.set(enrollmentChart.options);
        },
        error: () => {
          this.allUsers.set([]);
        },
      });
  }

  private loadRecentUsers(): void {
    this.userService.getUsers().subscribe({
      next: (users) => this.recentUsers.set(users.slice(0, 5)),
      error: () => this.recentUsers.set([]),
    });
  }
}
