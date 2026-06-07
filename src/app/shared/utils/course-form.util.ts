import { FormBuilder, Validators } from '@angular/forms';

import { CourseStatus } from '../../models/course-status';
import { CourseDto } from '../../models/course.dto';
import { CreateCourseDto } from '../../models/create-course.dto';
import { UpdateCourseDto } from '../../models/update-course.dto';

export function buildCourseForm(fb: FormBuilder, course?: CourseDto) {
  return fb.nonNullable.group({
    instructorId: [course?.instructorId ?? '', Validators.required],
    title: [course?.title ?? '', [Validators.required, Validators.minLength(3)]],
    description: [course?.description ?? ''],
    status: [course?.status ?? CourseStatus.Draft, Validators.required],
    maxEnrollments: [course?.maxEnrollments ?? 30, [Validators.required, Validators.min(1)]],
  });
}

export function toCreateCourseDto(
  value: ReturnType<typeof buildCourseForm>['value'],
): CreateCourseDto {
  return {
    instructorId: value.instructorId!,
    title: value.title!,
    description: value.description ?? '',
    status: value.status!,
    maxEnrollments: value.maxEnrollments!,
  };
}

export function toUpdateCourseDto(
  value: ReturnType<typeof buildCourseForm>['value'],
): UpdateCourseDto {
  return toCreateCourseDto(value);
}
