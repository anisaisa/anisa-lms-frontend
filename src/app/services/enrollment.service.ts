import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { CreateEnrollmentDto } from '../models/create-enrollment.dto';
import { EnrollmentDto } from '../models/enrollment.dto';
import { UpdateEnrollmentDto } from '../models/update-enrollment.dto';
import { normalizeEnrollmentStatus } from '../shared/utils/enrollment.util';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class EnrollmentService {
  private readonly api = inject(ApiService);

  getEnrollments(): Observable<EnrollmentDto[]> {
    return this.api
      .get<unknown[]>('/enrollment')
      .pipe(map((items) => items.map((item) => this.mapEnrollment(item))));
  }

  getEnrollmentById(enrollmentId: number): Observable<EnrollmentDto> {
    return this.api
      .get<unknown>(`/enrollment/${enrollmentId}`)
      .pipe(map((item) => this.mapEnrollment(item)));
  }

  createEnrollment(dto: CreateEnrollmentDto): Observable<{ message: string }> {
    return this.api.post<{ message: string }>('/enrollment', dto);
  }

  updateEnrollment(enrollmentId: number, dto: UpdateEnrollmentDto): Observable<void> {
    return this.api.put<void>(`/enrollment/${enrollmentId}`, dto);
  }

  deleteEnrollment(enrollmentId: number): Observable<void> {
    return this.api.delete<void>(`/enrollment/${enrollmentId}`);
  }

  mapEnrollment(raw: unknown): EnrollmentDto {
    const record = raw as Record<string, unknown>;
    return {
      id: Number(record['id'] ?? record['Id']),
      studentId: String(record['studentId'] ?? record['StudentId'] ?? ''),
      status: normalizeEnrollmentStatus(record['status'] ?? record['Status']),
      studentFullName: String(record['studentFullName'] ?? record['StudentFullName'] ?? ''),
      courseId: Number(record['courseId'] ?? record['CourseId'] ?? 0),
      courseTitle: String(record['courseTitle'] ?? record['CourseTitle'] ?? ''),
    };
  }
}
