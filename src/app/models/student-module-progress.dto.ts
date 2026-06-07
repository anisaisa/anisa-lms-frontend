export interface StudentModuleProgressDto {
  id: number;
  moduleId: number;
  isCompleted: boolean;
  completionDate: string | null;
  studentFullName: string;
}
