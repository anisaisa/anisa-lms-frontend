import { Component, input } from '@angular/core';

import { CourseProgressStats } from '../../utils/progress.util';

@Component({
  selector: 'app-course-progress-summary',
  templateUrl: './course-progress-summary.component.html',
  styleUrl: './course-progress-summary.component.css',
})
export class CourseProgressSummaryComponent {
  readonly stats = input.required<CourseProgressStats>();
  readonly loading = input(false);
  readonly compact = input(false);
}
