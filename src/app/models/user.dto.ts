export interface UserDto {
  id: string;
  role: string;
  fullName: string;
  token: string;
}

import type { User } from './user.model';

/** @deprecated Prefer {@link User} — kept for existing imports */
export type UserListItem = User;