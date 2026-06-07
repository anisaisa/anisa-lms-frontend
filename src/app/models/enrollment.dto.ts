import { EnrollmentStatus } from './enrollment-status';

export interface EnrollmentDto {
  id: number;
  status: EnrollmentStatus;
  studentFullName: string;
}
