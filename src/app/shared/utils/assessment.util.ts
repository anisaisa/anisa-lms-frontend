import { AssessmentDto } from '../../models/assessment.dto';
import { CourseDto } from '../../models/course.dto';

export interface AssessmentCourseGroup {
  courseId: number;
  courseTitle: string;
  assessments: AssessmentDto[];
}

export function extractAssessmentsFromCourses(courses: CourseDto[]): AssessmentDto[] {
  const items: AssessmentDto[] = [];

  for (const course of courses) {
    for (const assessment of course.assessments ?? []) {
      items.push({
        ...assessment,
        courseId: course.id,
        courseTitle: course.title,
      });
    }
  }

  return items.sort((a, b) => compareDueDates(a.dueDate, b.dueDate));
}

export function groupAssessmentsByCourse(assessments: AssessmentDto[]): AssessmentCourseGroup[] {
  const groups = new Map<number, AssessmentCourseGroup>();

  for (const assessment of assessments) {
    const courseId = assessment.courseId ?? 0;
    const existing = groups.get(courseId);
    if (existing) {
      existing.assessments.push(assessment);
    } else {
      groups.set(courseId, {
        courseId,
        courseTitle: assessment.courseTitle ?? 'Unknown course',
        assessments: [assessment],
      });
    }
  }

  return [...groups.values()]
    .map((group) => ({
      ...group,
      assessments: [...group.assessments].sort((a, b) => compareDueDates(a.dueDate, b.dueDate)),
    }))
    .sort((a, b) => a.courseTitle.localeCompare(b.courseTitle));
}

export function getUpcomingAssessments(assessments: AssessmentDto[]): AssessmentDto[] {
  const now = Date.now();
  return assessments
    .filter((a) => parseDueDate(a.dueDate).getTime() >= now)
    .sort((a, b) => compareDueDates(a.dueDate, b.dueDate));
}

export function isAssessmentOverdue(assessment: AssessmentDto): boolean {
  return parseDueDate(assessment.dueDate).getTime() < Date.now();
}

export function isAssessmentUpcoming(assessment: AssessmentDto): boolean {
  return !isAssessmentOverdue(assessment);
}

export function formatAssessmentDueDate(value: string): string {
  const date = parseDueDate(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function toDateTimeLocalValue(iso: string): string {
  const date = parseDueDate(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function fromDateTimeLocalValue(value: string): string {
  if (!value) {
    return '';
  }
  return new Date(value).toISOString();
}

function parseDueDate(value: string): Date {
  return new Date(value);
}

function compareDueDates(a: string, b: string): number {
  return parseDueDate(a).getTime() - parseDueDate(b).getTime();
}
