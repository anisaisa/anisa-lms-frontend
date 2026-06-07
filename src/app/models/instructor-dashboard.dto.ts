import { AssessmentDto } from './assessment.dto';
import { DashboardCourseDto } from './dashboard-course.dto';

export interface InstructorDashboardDto {
  myCourses: DashboardCourseDto[];
  recentCourses: DashboardCourseDto[];
  upcomingAssessments: AssessmentDto[];
  studentsEnrolled: number;
}
