import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-dashboard-kpi-card',
  imports: [RouterLink],
  templateUrl: './dashboard-kpi-card.component.html',
  styleUrl: './dashboard-kpi-card.component.css',
})
export class DashboardKpiCardComponent {
  readonly label = input.required<string>();
  readonly value = input.required<string | number>();
  readonly hint = input<string | null>(null);
  readonly link = input<string | null>(null);
}
