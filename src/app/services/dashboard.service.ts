import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { AdminDashboardDto } from '../models/admin-dashboard.dto';
import { AssessmentDto } from '../models/assessment.dto';
import { DashboardCourseDto } from '../models/dashboard-course.dto';
import { InstructorDashboardDto } from '../models/instructor-dashboard.dto';
import { StudentDashboardDto } from '../models/student-dashboard.dto';
import { AssessmentService } from './assessment.service';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly api = inject(ApiService);
  private readonly assessmentService = inject(AssessmentService);

  getAdminDashboard(email: string): Observable<AdminDashboardDto> {
    return this.api
      .get<unknown>('/dashboard', { email })
      .pipe(map((raw) => this.mapAdminDashboard(raw)));
  }

  getInstructorDashboard(email: string): Observable<InstructorDashboardDto> {
    return this.api
      .get<unknown>('/dashboard', { email })
      .pipe(map((raw) => this.mapInstructorDashboard(raw)));
  }

  getStudentDashboard(email: string): Observable<StudentDashboardDto> {
    return this.api
      .get<unknown>('/dashboard', { email })
      .pipe(map((raw) => this.mapStudentDashboard(raw)));
  }

  private mapAdminDashboard(raw: unknown): AdminDashboardDto {
    const record = raw as Record<string, unknown>;
    return {
      totalUsers: Number(record['totalUsers'] ?? record['TotalUsers'] ?? 0),
      totalCourses: Number(record['totalCourses'] ?? record['TotalCourses'] ?? 0),
      popularCourses: this.mapCourseList(record['popularCourses'] ?? record['PopularCourses']),
      recentCourses: this.mapCourseList(record['recentCourses'] ?? record['RecentCourses']),
    };
  }

  private mapInstructorDashboard(raw: unknown): InstructorDashboardDto {
    const record = raw as Record<string, unknown>;
    const myCourses = this.mapCourseList(record['myCourses'] ?? record['MyCourses']);
    const assessmentsRaw = (record['assessments'] ?? record['Assessments'] ?? []) as unknown[];

    const upcomingAssessments = this.flattenCourseAssessments(myCourses, assessmentsRaw)
      .filter((a) => new Date(a.dueDate).getTime() >= Date.now())
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

    return {
      myCourses,
      recentCourses: this.mapCourseList(record['recentCourses'] ?? record['RecentCourses']),
      upcomingAssessments,
      studentsEnrolled: Number(record['studentsEnrolled'] ?? record['StudentsEnrolled'] ?? 0),
    };
  }

  private mapStudentDashboard(raw: unknown): StudentDashboardDto {
    const record = raw as Record<string, unknown>;
    return {
      coursesInProgress: this.mapCourseList(
        record['coursesInProgress'] ?? record['CoursesInProgress'],
      ),
      completedAssessments: Number(
        record['completedAssessments'] ?? record['CompletedAssessments'] ?? 0,
      ),
      totalEnrollments: Number(record['totalEnrollments'] ?? record['TotalEnrollments'] ?? 0),
      modulesCompleted: Number(record['modulesCompleted'] ?? record['ModulesCompleted'] ?? 0),
    };
  }

  private flattenCourseAssessments(
    courses: DashboardCourseDto[],
    assessmentsByCourse: unknown[],
  ): AssessmentDto[] {
    const items: AssessmentDto[] = [];

    courses.forEach((course, index) => {
      const group = assessmentsByCourse[index];
      if (!Array.isArray(group)) {
        return;
      }
      for (const raw of group) {
        const assessment = this.assessmentService.mapAssessment(raw);
        items.push({
          ...assessment,
          courseId: course.id,
          courseTitle: course.title,
        });
      }
    });

    return items;
  }

  private mapCourseList(raw: unknown): DashboardCourseDto[] {
    if (!Array.isArray(raw)) {
      return [];
    }
    return raw.map((item) => this.mapCourse(item));
  }

  private mapCourse(raw: unknown): DashboardCourseDto {
    const record = raw as Record<string, unknown>;
   // const enrollments = record['enrollments'] ?? record['Enrollments'];
    const instructor = record['instructor'] ?? record['Instructor'];
    const instructorRecord = instructor as Record<string, unknown> | undefined;
    const createdRaw = record['createdAt'] ?? record['CreatedAt'];

    return {
      id: Number(record['id'] ?? record['Id']),
      title: String(record['title'] ?? record['Title'] ?? 'Untitled course'),
      description: String(record['description'] ?? record['Description'] ?? ''),
      status: String(record['status'] ?? record['Status'] ?? ''),
      createdAt: createdRaw ? String(createdRaw) : undefined,
     enrollmentCount: Number(
  record['enrollmentCount'] ??
  record['EnrollmentCount'] ??
  0
),
      instructorFullName: instructorRecord
        ? String(instructorRecord['fullName'] ?? instructorRecord['FullName'] ?? '')
        : undefined,
    };
  }
}
