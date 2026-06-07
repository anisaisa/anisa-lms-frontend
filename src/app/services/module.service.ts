import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { CreateModuleDto } from '../models/create-module.dto';
import { ModuleDto } from '../models/module.dto';
import { UpdateModuleDto } from '../models/update-module.dto';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class ModuleService {
  private readonly api = inject(ApiService);

  getModulesForCourse(courseId: number, studentId: string): Observable<ModuleDto[]> {
    return this.api
      .get<unknown[]>(`/course/${courseId}/module`, { studentId })
      .pipe(map((items) => items.map((item) => this.mapModule(item))));
  }

  createModule(dto: CreateModuleDto): Observable<{ message: string }> {
    return this.api.post<{ message: string }>('/module', dto);
  }

  updateModule(moduleId: number, dto: UpdateModuleDto): Observable<void> {
    return this.api.put<void>(`/module/${moduleId}`, dto);
  }

  deleteModule(moduleId: number): Observable<void> {
    return this.api.delete<void>(`/module/${moduleId}`);
  }

  private mapModule(raw: unknown): ModuleDto {
    const record = raw as Record<string, unknown>;
    return {
      id: Number(record['id'] ?? record['Id']),
      title: String(record['title'] ?? record['Title'] ?? ''),
      content: String(record['content'] ?? record['Content'] ?? ''),
      orderIndex: Number(record['orderIndex'] ?? record['OrderIndex'] ?? 0),
      isLocked: Boolean(record['isLocked'] ?? record['IsLocked'] ?? false),
    };
  }
}
