import { FormBuilder, Validators } from '@angular/forms';

import { UserRole } from '../../models/user-role';

export function buildAssignRoleForm(fb: FormBuilder) {
  return fb.nonNullable.group({
    userId: ['', Validators.required],
    roleName: [UserRole.Student, Validators.required],
  });
}
