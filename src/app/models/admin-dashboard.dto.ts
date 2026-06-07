import { DashboardCourseDto } from './dashboard-course.dto';

export interface AdminDashboardDto {
  totalUsers: number;
  totalCourses: number;
  popularCourses: DashboardCourseDto[];
  recentCourses: DashboardCourseDto[];
}
