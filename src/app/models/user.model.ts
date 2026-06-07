/** API user list/detail shape from GET /api/user/users */
export interface User {
  id: string;
  fullName: string;
  email: string;
  role: string;
}
