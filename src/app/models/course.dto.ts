import { AssessmentDto } from './assessment.dto';

export interface CourseDto {
  id: number;
  instructorId: string;
  instructorFullName: string;
  title: string;
  description: string;
  status: string;
  maxEnrollments: number;
  enrollments: unknown[];
  modules: unknown[];
  assessments: AssessmentDto[];
}
