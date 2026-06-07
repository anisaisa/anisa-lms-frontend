import { User } from '../../models/user.model';
import { UserRole } from '../../models/user-role';

export function normalizeUserRole(role: string): UserRole | null {
  const match = Object.values(UserRole).find(
    (value) => value.toLowerCase() === role.trim().toLowerCase(),
  );
  return match ?? null;
}

export function getUserRoleBadgeClass(role: string): string {
  switch (normalizeUserRole(role)) {
    case UserRole.Admin:
      return 'user-role-badge user-role-badge--admin';
    case UserRole.Instructor:
      return 'user-role-badge user-role-badge--instructor';
    case UserRole.Student:
      return 'user-role-badge user-role-badge--student';
    default:
      return 'user-role-badge';
  }
}

export function getUserRoleLabel(role: string): string {
  return normalizeUserRole(role) ?? (role || 'Unknown');
}

export function filterUsers(
  users: User[],
  nameQuery: string,
  emailQuery: string,
  roleFilter: UserRole | 'all',
): User[] {
  const name = nameQuery.trim().toLowerCase();
  const email = emailQuery.trim().toLowerCase();

  return users.filter((user) => {
    const matchesName = !name || user.fullName.toLowerCase().includes(name);
    const matchesEmail = !email || user.email.toLowerCase().includes(email);
    const matchesRole =
      roleFilter === 'all' ||
      user.role.toLowerCase() === roleFilter.toLowerCase();
    return matchesName && matchesEmail && matchesRole;
  });
}
