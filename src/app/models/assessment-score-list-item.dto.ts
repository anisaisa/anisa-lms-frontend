import { AssessmentScoreDto } from './assessment-score.dto';

export interface AssessmentScoreListItem extends AssessmentScoreDto {
  assessmentId: number;
  assessmentTitle: string;
  courseTitle: string;
}
