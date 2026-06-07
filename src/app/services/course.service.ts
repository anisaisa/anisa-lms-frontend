import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { CourseQuery } from '../models/course-query.model';
import { CourseDto } from '../models/course.dto';
import { CreateCourseDto } from '../models/create-course.dto';
import { PagedResponse } from '../models/paged-response.model';
import { UpdateCourseDto } from '../models/update-course.dto';
import { AssessmentDto } from '../models/assessment.dto';
import { ApiService } from './api.service';
import { AssessmentService } from './assessment.service';

@Injectable({ providedIn: 'root' })
export class CourseService {
  private readonly api = inject(ApiService);
  private readonly assessmentService = inject(AssessmentService);

  getCourses(query: CourseQuery): Observable<PagedResponse<CourseDto>> {
    const params: Record<string, string | number> = {
      page: query.page,
      pageSize: query.pageSize,
    };

    if (query.title?.trim()) {
      params['title'] = query.title.trim();
    }

    return this.api
      .get<Record<string, unknown>>('/course', params)
      .pipe(map((response) => this.mapPagedResponse(response)));
  }

  getCourseById(id: number): Observable<CourseDto | undefined> {
    return this.getCourses({ page: 1, pageSize: 500 }).pipe(
      map((response) => response.items.find((course) => course.id === id)),
    );
  }

  createCourse(dto: CreateCourseDto): Observable<{ message: string }> {
    return this.api.post<{ message: string }>('/course', dto);
  }

  updateCourse(id: number, dto: UpdateCourseDto): Observable<void> {
    return this.api.put<void>(`/course/${id}`, dto);
  }

  deleteCourse(id: number): Observable<void> {
    return this.api.delete<void>(`/course/${id}`);
  }

  private mapPagedResponse(raw: Record<string, unknown>): PagedResponse<CourseDto> {
    const items = (raw['items'] ?? raw['Items'] ?? []) as Record<string, unknown>[];

    const totalCount = Number(raw['totalCount'] ?? raw['TotalCount'] ?? 0);
    const pageSize = Number(raw['pageSize'] ?? raw['PageSize'] ?? 10);
    const totalPages =
      Number(raw['totalPages'] ?? raw['TotalPages']) ||
      (pageSize > 0 ? Math.ceil(totalCount / pageSize) : 0);

    return {
      items: items.map((item) => this.mapCourse(item)),
      totalCount,
      page: Number(raw['page'] ?? raw['Page'] ?? 1),
      pageSize,
      totalPages,
    };
  }

  private mapCourse(raw: Record<string, unknown>): CourseDto {
    return {
      id: Number(raw['id'] ?? raw['Id']),
      instructorId: String(raw['instructorId'] ?? raw['InstructorId'] ?? ''),
      instructorFullName: String(raw['instructorFullName'] ?? raw['InstructorFullName'] ?? ''),
      title: String(raw['title'] ?? raw['Title'] ?? ''),
      description: String(raw['description'] ?? raw['Description'] ?? ''),
      status: String(raw['status'] ?? raw['Status'] ?? ''),
      maxEnrollments: Number(raw['maxEnrollments'] ?? raw['MaxEnrollments'] ?? 0),
      enrollments: (raw['enrollments'] ?? raw['Enrollments'] ?? []) as unknown[],
      modules: (raw['modules'] ?? raw['Modules'] ?? []) as unknown[],
      assessments: this.mapAssessments(raw['assessments'] ?? raw['Assessments'] ?? []),
    };
  }

  private mapAssessments(raw: unknown): AssessmentDto[] {
    if (!Array.isArray(raw)) {
      return [];
    }
    return raw.map((item) => this.assessmentService.mapAssessment(item));
  }
}
