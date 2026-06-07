import { Component, input } from '@angular/core';

import { getUserRoleBadgeClass, getUserRoleLabel } from '../../utils/user.util';

@Component({
  selector: 'app-user-role-badge',
  template: `<span [class]="badgeClass()">{{ label() }}</span>`,
  styleUrl: './user-role-badge.component.css',
})
export class UserRoleBadgeComponent {
  readonly role = input.required<string>();

  protected label(): string {
    return getUserRoleLabel(this.role());
  }

  protected badgeClass(): string {
    return getUserRoleBadgeClass(this.role());
  }
}
