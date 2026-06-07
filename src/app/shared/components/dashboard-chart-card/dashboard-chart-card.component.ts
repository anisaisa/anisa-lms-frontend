import { Component, input } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions, ChartType } from 'chart.js';

@Component({
  selector: 'app-dashboard-chart-card',
  imports: [BaseChartDirective],
  templateUrl: './dashboard-chart-card.component.html',
  styleUrl: './dashboard-chart-card.component.css',
})
export class DashboardChartCardComponent {
  readonly title = input.required<string>();
  readonly type = input.required<ChartType>();
  readonly data = input.required<ChartData>();
  readonly options = input<ChartOptions | undefined>();
  readonly emptyMessage = input('No data to chart yet.');
  readonly loading = input(false);
  readonly hasData = input(true);
}
