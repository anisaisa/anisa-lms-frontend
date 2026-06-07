export interface CreateAssessmentDto {
  title: string;
  maxPoints: number;
  passRequirement: number;
  dueDate: string;
  courseId: number;
}
