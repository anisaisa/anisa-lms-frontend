export interface CreateStudentModuleProgressDto {
  studentId: string;
  moduleId: number;
  isCompleted: boolean;
  completionDate?: string;
}
