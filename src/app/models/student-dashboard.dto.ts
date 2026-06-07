import { DashboardCourseDto } from './dashboard-course.dto';

export interface StudentDashboardDto {
  coursesInProgress: DashboardCourseDto[];
  completedAssessments: number;
  totalEnrollments: number;
  modulesCompleted: number;
}
