import { ChartOptions } from 'chart.js';

export const CHART_PALETTE = [
  '#7c3aed',
  '#8b5cf6',
  '#a78bfa',
  '#c084fc',
  '#9333ea',
  '#6d28d9',
  '#ddd6fe',
  '#e9d5ff',
];

export const ENROLLMENT_STATUS_CHART_COLORS: Record<string, string> = {
  Active: '#7c3aed',
  Completed: '#6366f1',
  Dropped: '#ef4444',
  PendingPayment: '#f59e0b',
};

export const ROLE_CHART_COLORS: Record<string, string> = {
  Admin: '#ef4444',
  Instructor: '#6366f1',
  Student: '#7c3aed',
};

export function getChartColor(index: number): string {
  return CHART_PALETTE[index % CHART_PALETTE.length];
}

export function getCartesianChartOptions(): ChartOptions<'bar'> {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: '#5c5470', boxWidth: 12, padding: 14 },
      },
    },
    scales: {
      x: {
        ticks: { color: '#8b8499', maxRotation: 45, minRotation: 0 },
        grid: { color: 'rgb(124 58 237 / 0.08)' },
      },
      y: {
        ticks: { color: '#8b8499', precision: 0 },
        grid: { color: 'rgb(124 58 237 / 0.08)' },
        beginAtZero: true,
      },
    },
  } as ChartOptions<'bar'>;
}

export function getRadialChartOptions(): ChartOptions<'pie'> {
  return getDoughnutChartOptions() as ChartOptions<'pie'>;
}

export function getDoughnutChartOptions(): ChartOptions<'doughnut'> {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: '#5c5470', boxWidth: 12, padding: 14 },
      },
    },
  } as ChartOptions<'doughnut'>;
}
