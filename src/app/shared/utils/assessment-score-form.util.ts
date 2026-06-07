import { FormBuilder, Validators } from '@angular/forms';

import { CreateAssessmentScoreDto } from '../../models/create-assessment-score.dto';
import { UpdateAssessmentScoreDto } from '../../models/update-assessment-score.dto';

export function buildCreateAssessmentScoreForm(fb: FormBuilder) {
  return fb.nonNullable.group({
    studentId: ['', Validators.required],
    assessmentId: [0, [Validators.required, Validators.min(1)]],
    score: [0, [Validators.required, Validators.min(0)]],
  });
}

export function buildUpdateAssessmentScoreForm(fb: FormBuilder, score = 0) {
  return fb.nonNullable.group({
    score: [score, [Validators.required, Validators.min(0)]],
  });
}

export function toCreateAssessmentScoreDto(value: {
  studentId: string;
  assessmentId: number | string;
  score: number | string;
}): CreateAssessmentScoreDto {
  return {
    studentId: value.studentId,
    assessmentId: Number(value.assessmentId),
    score: Number(value.score),
  };
}

export function toUpdateAssessmentScoreDto(value: {
  score: number | string;
}): UpdateAssessmentScoreDto {
  return { score: Number(value.score) };
}
