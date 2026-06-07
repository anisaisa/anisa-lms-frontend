import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { UserRole } from '../models/user-role';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const requiredRoles = route.data['roles'] as UserRole[] | undefined;

  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }

  if (!requiredRoles?.length) {
    return true;
  }

  if (auth.hasRole(...requiredRoles)) {
    return true;
  }

  return router.createUrlTree(['/dashboard']);
};
