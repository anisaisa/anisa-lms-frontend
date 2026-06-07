import { Component, effect, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';

import { User } from '../../../models/user.model';
import { USER_ROLES, UserRole } from '../../../models/user-role';
import { PageAlertComponent } from '../page-alert/page-alert.component';
import { ApiFieldErrors, getFieldError } from '../../utils/api-error.util';
import { buildAssignRoleForm } from '../../utils/assign-role-form.util';

@Component({
  selector: 'app-assign-role-dialog',
  imports: [ReactiveFormsModule, PageAlertComponent],
  templateUrl: './assign-role-dialog.component.html',
  styleUrl: './assign-role-dialog.component.css',
})
export class AssignRoleDialogComponent {
  private readonly fb = inject(FormBuilder);

  readonly open = input(false);
  readonly user = input<User | null>(null);
  readonly submitting = input(false);
  readonly apiError = input<string | null>(null);
  readonly fieldErrors = input<ApiFieldErrors>({});

  readonly confirmed = output<{ userId: string; roleName: string }>();
  readonly cancelled = output<void>();

  protected readonly roles = USER_ROLES;
  protected readonly form = buildAssignRoleForm(this.fb);

  constructor() {
    effect(() => {
      const selected = this.user();
      if (selected) {
        this.form.patchValue({
          userId: selected.id,
          roleName: normalizeRoleForForm(selected.role),
        });
      }
    });
  }

  protected fieldError(fieldName: string): string | null {
    return getFieldError(this.fieldErrors(), fieldName);
  }

  protected roleValue(role: UserRole): UserRole {
    return role;
  }

  protected onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.confirmed.emit(this.form.getRawValue());
  }
}

function normalizeRoleForForm(role: string): UserRole {
  const match = USER_ROLES.find((r) => r.toLowerCase() === role.toLowerCase());
  return match ?? UserRole.Student;
}
