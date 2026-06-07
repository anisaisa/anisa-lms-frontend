import { Component, input } from '@angular/core';

import { EnrollmentStatus } from '../../../models/enrollment-status';
import {
  getEnrollmentStatusBadgeClass,
  getEnrollmentStatusLabel,
} from '../../utils/enrollment.util';

@Component({
  selector: 'app-enrollment-status-badge',
  template: `
    <span [class]="badgeClass()">{{ label() }}</span>
  `,
  styleUrl: './enrollment-status-badge.component.css',
})
export class EnrollmentStatusBadgeComponent {
  readonly status = input.required<EnrollmentStatus>();

  protected label(): string {
    return getEnrollmentStatusLabel(this.status());
  }

  protected badgeClass(): string {
    return getEnrollmentStatusBadgeClass(this.status());
  }
}
