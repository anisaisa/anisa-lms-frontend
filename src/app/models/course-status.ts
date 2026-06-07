export enum CourseStatus {
  Draft = 'Draft',
  Published = 'Published',
  Scheduled = 'Scheduled',
  Private = 'Private',
  Archived = 'Archived',
}

export const COURSE_STATUSES: CourseStatus[] = [
  CourseStatus.Draft,
  CourseStatus.Published,
  CourseStatus.Scheduled,
  CourseStatus.Private,
  CourseStatus.Archived,
];
