export interface ProgressListItem {
  id: number;
  studentId: string;
  studentFullName: string;
  courseId: number;
  courseTitle: string;
  moduleId: number;
  moduleTitle: string;
  isCompleted: boolean;
  completionDate: string | null;
}
