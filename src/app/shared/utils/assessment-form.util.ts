import { FormBuilder, Validators } from '@angular/forms';

import { AssessmentDto } from '../../models/assessment.dto';
import { CreateAssessmentDto } from '../../models/create-assessment.dto';
import { UpdateAssessmentDto } from '../../models/update-assessment.dto';
import { fromDateTimeLocalValue, toDateTimeLocalValue } from './assessment.util';

export function buildAssessmentForm(
  fb: FormBuilder,
  assessment?: AssessmentDto,
  courseId?: number,
) {
  return fb.nonNullable.group({
    title: [assessment?.title ?? '', [Validators.required, Validators.minLength(3)]],
    maxPoints: [assessment?.maxPoints ?? 100, [Validators.required, Validators.min(1)]],
    passRequirement: [assessment?.passRequirement ?? 50, [Validators.required, Validators.min(0)]],
    dueDate: [
      assessment?.dueDate ? toDateTimeLocalValue(assessment.dueDate) : '',
      Validators.required,
    ],
    courseId: [courseId ?? assessment?.courseId ?? 0, [Validators.required, Validators.min(1)]],
  });
}

export function toCreateAssessmentDto(
  value: ReturnType<typeof buildAssessmentForm>['value'],
): CreateAssessmentDto {
  return {
    title: value.title!,
    maxPoints: value.maxPoints!,
    passRequirement: value.passRequirement!,
    dueDate: fromDateTimeLocalValue(value.dueDate!),
    courseId: value.courseId!,
  };
}

export function toUpdateAssessmentDto(
  value: ReturnType<typeof buildAssessmentForm>['value'],
): UpdateAssessmentDto {
  return {
    title: value.title!,
    maxPoints: value.maxPoints!,
    passRequirement: value.passRequirement!,
    dueDate: fromDateTimeLocalValue(value.dueDate!),
  };
}
