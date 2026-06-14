export type NavIcon =
  | 'dashboard'
  | 'courses'
  | 'progress'
  | 'assessments'
  | 'scores'
  | 'enrollments'
  | 'users';

export interface NavItem {
  label: string;
  path: string;
  icon: NavIcon;
}
