import { ChartData, ChartOptions } from 'chart.js';

import { DashboardCourseDto } from '../../models/dashboard-course.dto';
import { EnrollmentDto } from '../../models/enrollment.dto';
import { ENROLLMENT_STATUS_LABELS, EnrollmentStatus } from '../../models/enrollment-status';
import { User } from '../../models/user.model';
import { UserRole } from '../../models/user-role';
import {
  ENROLLMENT_STATUS_CHART_COLORS,
  ROLE_CHART_COLORS,
  getCartesianChartOptions,
  getChartColor,
  getDoughnutChartOptions,
  getRadialChartOptions,
} from './chart-theme.util';

export function buildCoursesByEnrollmentChart(
  courses: DashboardCourseDto[],
): { data: ChartData<'bar'>; options: ChartOptions<'bar'> } {
  const sorted = [...courses]
    .sort((a, b) => (b.enrollmentCount ?? 0) - (a.enrollmentCount ?? 0))
    .slice(0, 8);

  return {
    data: {
      labels: sorted.map((course) => truncateLabel(course.title, 18)),
      datasets: [
        {
          label: 'Enrollments',
          data: sorted.map((course) => course.enrollmentCount ?? 0),
          backgroundColor: sorted.map((_, index) => getChartColor(index)),
          borderRadius: 6,
          borderSkipped: false,
        },
      ],
    },
    options: getCartesianChartOptions(),
  };
}

export function buildUsersByRoleChart(
  users: User[],
): { data: ChartData<'pie'>; options: ChartOptions<'pie'> } {
  const counts: Record<string, number> = {
    [UserRole.Admin]: 0,
    [UserRole.Instructor]: 0,
    [UserRole.Student]: 0,
  };

  for (const user of users) {
    const role =
      Object.values(UserRole).find(
        (value) => value.toLowerCase() === user.role.toLowerCase(),
      ) ?? UserRole.Student;
    counts[role] = (counts[role] ?? 0) + 1;
  }

  const labels = Object.keys(counts).filter((role) => counts[role] > 0);

  return {
    data: {
      labels,
      datasets: [
        {
          data: labels.map((role) => counts[role]),
          backgroundColor: labels.map((role) => ROLE_CHART_COLORS[role] ?? getChartColor(0)),
          borderWidth: 0,
        },
      ],
    },
    options: getRadialChartOptions(),
  };
}

export function buildEnrollmentStatusChart(
  enrollments: EnrollmentDto[],
): { data: ChartData<'doughnut'>; options: ChartOptions<'doughnut'> } {
  const statuses = [
    EnrollmentStatus.Active,
    EnrollmentStatus.Completed,
    EnrollmentStatus.Dropped,
    EnrollmentStatus.PendingPayment,
  ];

  const counts = statuses.map(
    (status) => enrollments.filter((item) => item.status === status).length,
  );

  return {
    data: {
      labels: statuses.map((status) => ENROLLMENT_STATUS_LABELS[status]),
      datasets: [
        {
          data: counts,
          backgroundColor: statuses.map(
            (status) => ENROLLMENT_STATUS_CHART_COLORS[status] ?? getChartColor(0),
          ),
          borderWidth: 0,
        },
      ],
    },
    options: getDoughnutChartOptions(),
  };
}

export function buildModuleProgressChart(
  completed: number,
  total: number,
): { data: ChartData<'doughnut'>; options: ChartOptions<'doughnut'> } {
  const remaining = Math.max(total - completed, 0);
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

  return {
    data: {
      labels: ['Completed', 'Remaining'],
      datasets: [
        {
          data: [completed, remaining],
          backgroundColor: ['#7c3aed', 'rgb(124 58 237 / 0.12)'],
          borderWidth: 0,
        },
      ],
    },
    options: {
      ...getDoughnutChartOptions(),
      plugins: {
        legend: { display: true, position: 'bottom' },
        title: {
          display: true,
          text: `${percent}% complete`,
          color: '#1a1625',
          font: { size: 14, weight: 'bold' },
        },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.label}: ${ctx.parsed} modules`,
          },
        },
      },
    } as ChartOptions<'doughnut'>,
  };
}

export function buildInstructorCoursesChart(
  courses: DashboardCourseDto[],
): { data: ChartData<'bar'>; options: ChartOptions<'bar'> } {
  const items = courses.slice(0, 8);

  return {
    data: {
      labels: items.map((course) => truncateLabel(course.title, 16)),
      datasets: [
        {
          label: 'Courses',
          data: items.map(() => 1),
          backgroundColor: items.map((_, index) => getChartColor(index)),
          borderRadius: 6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: {
          ticks: { color: '#8b8499', maxRotation: 45 },
          grid: { color: 'rgb(124 58 237 / 0.08)' },
        },
        y: {
          ticks: { display: false },
          grid: { display: false },
          max: 1.2,
          beginAtZero: true,
        },
      },
    } as ChartOptions<'bar'>,
  };
}

export function buildStudentAssessmentsChart(
  completed: number,
  totalEnrollments: number,
): { data: ChartData<'bar'>; options: ChartOptions<'bar'> } {
  return {
    data: {
      labels: ['Completed assessments', 'Courses enrolled'],
      datasets: [
        {
          label: 'Count',
          data: [completed, totalEnrollments],
          backgroundColor: ['#7c3aed', '#8b5cf6'],
          borderRadius: 6,
        },
      ],
    },
    options: getCartesianChartOptions(),
  };
}

function truncateLabel(value: string, max: number): string {
  if (value.length <= max) {
    return value;
  }
  return `${value.slice(0, max - 1)}…`;
}
