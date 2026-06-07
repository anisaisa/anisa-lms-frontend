import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { AssessmentDto } from '../models/assessment.dto';
import { AssessmentScoreDto } from '../models/assessment-score.dto';
import { CreateAssessmentDto } from '../models/create-assessment.dto';
import { UpdateAssessmentDto } from '../models/update-assessment.dto';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class AssessmentService {
  private readonly api = inject(ApiService);

  getUpcomingForCourse(courseId: number): Observable<AssessmentDto[]> {
    return this.api
      .get<unknown[]>(`/assessment/course/${courseId}/upcoming`)
      .pipe(map((items) => items.map((item) => this.mapAssessment(item))));
  }

  getResults(assessmentId: number, passed: boolean): Observable<AssessmentScoreDto[]> {
    return this.api
      .get<unknown[]>(`/assessment/${assessmentId}/results`, { passed })
      .pipe(map((items) => items.map((item) => this.mapScore(item))));
  }

  createAssessment(dto: CreateAssessmentDto): Observable<{ message: string }> {
    return this.api.post<{ message: string }>('/assessment', dto);
  }

  updateAssessment(assessmentId: number, dto: UpdateAssessmentDto): Observable<void> {
    return this.api.put<void>(`/assessment/${assessmentId}`, dto);
  }

  deleteAssessment(assessmentId: number): Observable<void> {
    return this.api.delete<void>(`/assessment/${assessmentId}`);
  }

  mapAssessment(raw: unknown): AssessmentDto {
    const record = raw as Record<string, unknown>;
    const dueRaw = record['dueDate'] ?? record['DueDate'];

    return {
      id: Number(record['id'] ?? record['Id']),
      title: String(record['title'] ?? record['Title'] ?? ''),
      maxPoints: Number(record['maxPoints'] ?? record['MaxPoints'] ?? 0),
      passRequirement: Number(record['passRequirement'] ?? record['PassRequirement'] ?? 0),
      dueDate: dueRaw ? String(dueRaw) : '',
      courseId: record['courseId'] != null ? Number(record['courseId'] ?? record['CourseId']) : undefined,
      courseTitle:
        record['courseTitle'] != null
          ? String(record['courseTitle'] ?? record['CourseTitle'])
          : undefined,
    };
  }

  private mapScore(raw: unknown): AssessmentScoreDto {
    const record = raw as Record<string, unknown>;
    return {
      id: Number(record['id'] ?? record['Id']),
      score: Number(record['score'] ?? record['Score'] ?? 0),
      studentFullName: String(record['studentFullName'] ?? record['StudentFullName'] ?? ''),
    };
  }
}
