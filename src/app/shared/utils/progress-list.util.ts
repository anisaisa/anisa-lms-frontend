import { forkJoin, Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs';

import { CourseDto } from '../../models/course.dto';
import { ProgressListItem } from '../../models/progress-list-item.dto';
import { ModuleDto } from '../../models/module.dto';
import { UserListItem } from '../../models/user.dto';
import { ModuleService } from '../../services/module.service';
import { ProgressService } from '../../services/progress.service';
import { formatCompletionDate } from './progress.util';

export type ProgressCompletionFilter = 'all' | 'completed' | 'incomplete';

export function fetchProgressListItems(
  courses: CourseDto[],
  students: UserListItem[],
  moduleLookupStudentId: string,
  moduleService: ModuleService,
  progressService: ProgressService,
): Observable<ProgressListItem[]> {
  if (!courses.length || !students.length) {
    return of([]);
  }

  const courseModuleJobs = courses.map((course) =>
    moduleService.getModulesForCourse(course.id, moduleLookupStudentId).pipe(
      catchError(() => of([] as ModuleDto[])),
      map((modules) => ({ course, modules })),
    ),
  );

  return forkJoin(courseModuleJobs).pipe(
    switchMap((courseModules) => {
      const progressJobs: Observable<ProgressListItem[]>[] = [];

      for (const student of students) {
        for (const { course, modules } of courseModules) {
          const moduleById = new Map(modules.map((module) => [module.id, module]));

          progressJobs.push(
            progressService.getProgress(student.id, course.id).pipe(
              catchError(() => of([])),
              map((records) =>
                records.map((record) => ({
                  id: record.id,
                  studentId: student.id,
                  studentFullName: record.studentFullName || student.fullName,
                  courseId: course.id,
                  courseTitle: course.title,
                  moduleId: record.moduleId,
                  moduleTitle:
                    moduleById.get(record.moduleId)?.title ?? `Module #${record.moduleId}`,
                  isCompleted: record.isCompleted,
                  completionDate: record.completionDate,
                })),
              ),
            ),
          );
        }
      }

      return forkJoin(progressJobs).pipe(
        map((groups) => groups.flat().sort((a, b) => a.id - b.id)),
      );
    }),
  );
}

export function filterProgressListItems(
  items: ProgressListItem[],
  searchQuery: string,
  completionFilter: ProgressCompletionFilter,
): ProgressListItem[] {
  const query = searchQuery.trim().toLowerCase();

  return items.filter((item) => {
    if (completionFilter === 'completed' && !item.isCompleted) {
      return false;
    }

    if (completionFilter === 'incomplete' && item.isCompleted) {
      return false;
    }

    if (!query) {
      return true;
    }

    const student = item.studentFullName.toLowerCase();
    const course = item.courseTitle.toLowerCase();
    const module = item.moduleTitle.toLowerCase();

    return student.includes(query) || course.includes(query) || module.includes(query);
  });
}

export function formatProgressCompletionLabel(value: string | null): string {
  return formatCompletionDate(value) ?? '—';
}
