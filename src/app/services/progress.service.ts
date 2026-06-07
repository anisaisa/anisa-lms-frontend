import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { CreateStudentModuleProgressDto } from '../models/create-student-module-progress.dto';
import { StudentModuleProgressDto } from '../models/student-module-progress.dto';
import { UpdateStudentModuleProgressDto } from '../models/update-student-module-progress.dto';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class ProgressService {
  private readonly api = inject(ApiService);

  getProgress(studentId: string, courseId: number): Observable<StudentModuleProgressDto[]> {
    return this.api
      .get<unknown[]>('/progress', { studentId, courseId })
      .pipe(map((items) => items.map((item) => this.mapProgress(item))));
  }

  createProgress(dto: CreateStudentModuleProgressDto): Observable<void> {
    return this.api.post<void>('/progress', dto);
  }

  updateProgress(progressId: number, dto: UpdateStudentModuleProgressDto): Observable<void> {
    return this.api.put<void>(`/progress/${progressId}`, dto);
  }

  deleteProgress(progressId: number): Observable<void> {
    return this.api.delete<void>(`/progress/${progressId}`);
  }

  private mapProgress(raw: unknown): StudentModuleProgressDto {
    const record = raw as Record<string, unknown>;
    const completionRaw = record['completionDate'] ?? record['CompletionDate'];

    return {
      id: Number(record['id'] ?? record['Id']),
      moduleId: Number(record['moduleId'] ?? record['ModuleId']),
      isCompleted: Boolean(record['isCompleted'] ?? record['IsCompleted'] ?? false),
      completionDate: completionRaw ? String(completionRaw) : null,
      studentFullName: String(record['studentFullName'] ?? record['StudentFullName'] ?? ''),
    };
  }
}
