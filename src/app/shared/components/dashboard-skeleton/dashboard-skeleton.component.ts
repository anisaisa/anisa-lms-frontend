import { Component, input } from '@angular/core';

@Component({
  selector: 'app-dashboard-skeleton',
  templateUrl: './dashboard-skeleton.component.html',
  styleUrl: './dashboard-skeleton.component.css',
})
export class DashboardSkeletonComponent {
  readonly kpiCount = input(4);
  readonly showTable = input(true);

  protected kpiPlaceholders(): number[] {
    return Array.from({ length: this.kpiCount() }, (_, index) => index);
  }
}
