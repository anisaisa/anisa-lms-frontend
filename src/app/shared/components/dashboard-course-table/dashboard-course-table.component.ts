import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { DashboardCourseDto } from '../../../models/dashboard-course.dto';

@Component({
  selector: 'app-dashboard-course-table',
  imports: [RouterLink],
  templateUrl: './dashboard-course-table.component.html',
  styleUrl: './dashboard-course-table.component.css',
})
export class DashboardCourseTableComponent {
  readonly title = input.required<string>();
  readonly subtitle = input<string | null>(null);
  readonly courses = input.required<DashboardCourseDto[]>();
  readonly showEnrollments = input(false);
  readonly showCreatedAt = input(true);
  readonly emptyMessage = input('No courses to display.');

  protected formatDate(value?: string): string {
    if (!value) {
      return '—';
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
}
