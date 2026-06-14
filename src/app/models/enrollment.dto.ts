import { EnrollmentStatus } from './enrollment-status';

export interface EnrollmentDto {
  id: number;
  studentId: string;
  studentFullName: string;
  courseId: number;
  courseTitle: string;
  status: EnrollmentStatus;
}
