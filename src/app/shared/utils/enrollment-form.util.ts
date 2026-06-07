import { FormBuilder, Validators } from '@angular/forms';

import { CreateEnrollmentDto } from '../../models/create-enrollment.dto';
import { EnrollmentStatus } from '../../models/enrollment-status';
import { UpdateEnrollmentDto } from '../../models/update-enrollment.dto';

export function buildCreateEnrollmentForm(fb: FormBuilder) {
  return fb.nonNullable.group({
    courseId: [0, [Validators.required, Validators.min(1)]],
    studentId: ['', Validators.required],
    status: [EnrollmentStatus.Active, Validators.required],
  });
}

export function buildUpdateEnrollmentStatusForm(
  fb: FormBuilder,
  status: EnrollmentStatus = EnrollmentStatus.Active,
) {
  return fb.nonNullable.group({
    status: [status, Validators.required],
  });
}

export function toCreateEnrollmentDto(value: {
  courseId: number | string;
  studentId: string;
  status: EnrollmentStatus;
}): CreateEnrollmentDto {
  return {
    courseId: Number(value.courseId),
    studentId: value.studentId,
    status: value.status,
  };
}

export function toUpdateEnrollmentDto(value: {
  status: EnrollmentStatus;
}): UpdateEnrollmentDto {
  return { status: value.status };
}
