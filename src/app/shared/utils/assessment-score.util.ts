import { AssessmentScoreListItem } from '../../models/assessment-score-list-item.dto';
import { AssessmentDto } from '../../models/assessment.dto';
import { AssessmentScoreDto } from '../../models/assessment-score.dto';

export function toAssessmentScoreListItem(
  score: AssessmentScoreDto,
  assessment: AssessmentDto,
): AssessmentScoreListItem {
  return {
    ...score,
    assessmentId: assessment.id,
    assessmentTitle: assessment.title,
    courseTitle: assessment.courseTitle ?? 'Unknown course',
  };
}

export function filterAssessmentScores(
  scores: AssessmentScoreListItem[],
  searchQuery: string,
): AssessmentScoreListItem[] {
  const query = searchQuery.trim().toLowerCase();

  return scores.filter((item) => {
    if (!query) {
      return true;
    }

    const student = (item.studentFullName ?? '').toLowerCase();
    const assessment = (item.assessmentTitle ?? '').toLowerCase();
    const course = (item.courseTitle ?? '').toLowerCase();

    return (
      student.includes(query) || assessment.includes(query) || course.includes(query)
    );
  });
}
