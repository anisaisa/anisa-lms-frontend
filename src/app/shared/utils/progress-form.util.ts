import { FormBuilder, Validators } from '@angular/forms';

import { CreateStudentModuleProgressDto } from '../../models/create-student-module-progress.dto';
import { UpdateStudentModuleProgressDto } from '../../models/update-student-module-progress.dto';

export function buildCreateProgressForm(fb: FormBuilder) {
  return fb.nonNullable.group({
    studentId: ['', Validators.required],
    courseId: [0, [Validators.required, Validators.min(1)]],
    moduleId: [0, [Validators.required, Validators.min(1)]],
    isCompleted: [true, Validators.required],
  });
}

export function buildUpdateProgressForm(
  fb: FormBuilder,
  isCompleted = false,
  completionDate = '',
) {
  return fb.nonNullable.group({
    isCompleted: [isCompleted, Validators.required],
    completionDate: [completionDate],
  });
}

export function toCreateProgressDto(value: {
  studentId: string;
  moduleId: number | string;
  isCompleted: boolean;
}): CreateStudentModuleProgressDto {
  return {
    studentId: value.studentId,
    moduleId: Number(value.moduleId),
    isCompleted: value.isCompleted,
  };
}

export function toUpdateProgressDto(value: {
  isCompleted: boolean;
  completionDate: string;
}): UpdateStudentModuleProgressDto {
  const dto: UpdateStudentModuleProgressDto = {
    isCompleted: value.isCompleted,
  };

  if (value.completionDate.trim()) {
    dto.completionDate = new Date(value.completionDate).toISOString();
  }

  return dto;
}

export function toDateTimeLocalValue(value: string | null): string {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const pad = (part: number) => String(part).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
