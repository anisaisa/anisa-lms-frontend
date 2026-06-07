import { EnrollmentStatus } from './enrollment-status';

export interface CreateEnrollmentDto {
  courseId: number;
  studentId: string;
  status: EnrollmentStatus;
}
