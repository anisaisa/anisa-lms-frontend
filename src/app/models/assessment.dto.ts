export interface AssessmentDto {
  id: number;
  title: string;
  maxPoints: number;
  passRequirement: number;
  dueDate: string;
  courseId?: number;
  courseTitle?: string;
}
