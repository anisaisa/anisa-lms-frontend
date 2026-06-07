export interface DashboardCourseDto {
  id: number;
  title: string;
  description?: string;
  status?: string;
  createdAt?: string;
  maxEnrollments?: number;
  enrollmentCount: number;
  instructorFullName?: string;
}