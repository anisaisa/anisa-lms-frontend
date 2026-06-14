import { AsyncPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged, finalize } from 'rxjs';

import { CourseDto } from '../../../models/course.dto';
import { PagedResponse } from '../../../models/paged-response.model';
import { UserRole } from '../../../models/user-role';
import { AuthService } from '../../../services/auth.service';
import { CourseService } from '../../../services/course.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { PageAlertComponent } from '../../../shared/components/page-alert/page-alert.component';
import { ToastService } from '../../../shared/services/toast.service';
import {
  ApiFieldErrors,
  getApiErrorMessage,
  getApiFieldErrors,
} from '../../../shared/utils/api-error.util';

@Component({
  selector: 'app-course-list',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    AsyncPipe,
    PageAlertComponent,
    LoadingSpinnerComponent,
    ConfirmDialogComponent,
    EmptyStateComponent,
  ],
  templateUrl: './course-list.component.html',
  styleUrl: './course-list.component.css',
})
export class CourseListComponent implements OnInit {
  private readonly courseService = inject(CourseService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  protected readonly currentUser$ = this.auth.currentUser$;
  protected readonly isAdmin = toSignal(
    this.auth.currentUser$.pipe(map(() => this.auth.hasRole(UserRole.Admin))),
    { initialValue: this.auth.hasRole(UserRole.Admin) },
  );
  protected readonly isInstructor = toSignal(
    this.auth.currentUser$.pipe(map(() => this.auth.hasRole(UserRole.Instructor))),
    { initialValue: this.auth.hasRole(UserRole.Instructor) },
  );

  protected readonly loading = signal(false);
  protected readonly deleting = signal(false);
  protected readonly apiError = signal<string | null>(null);
  protected readonly fieldErrors = signal<ApiFieldErrors>({});

  protected readonly courses = signal<CourseDto[]>([]);
  protected readonly totalCount = signal(0);
  protected readonly totalPages = signal(0);
  protected readonly page = signal(1);
  protected readonly pageSize = signal(9);

  protected readonly deleteDialogOpen = signal(false);
  protected readonly courseToDelete = signal<CourseDto | null>(null);

  protected readonly searchControl = new FormControl('', { nonNullable: true });

  ngOnInit(): void {
    this.applyNavigationMessage();
    this.loadCourses();

    this.searchControl.valueChanges
      .pipe(debounceTime(350), distinctUntilChanged())
      .subscribe(() => {
        this.page.set(1);
        this.loadCourses();
      });
  }

  protected loadCourses(): void {
    this.loading.set(true);
    this.apiError.set(null);

    this.courseService
      .getCourses({
        title: this.searchControl.value,
        page: this.page(),
        pageSize: this.pageSize(),
      })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => this.applyResponse(response),
        error: (error) => this.handleError(error),
      });
  }

  protected goToPage(nextPage: number): void {
    if (nextPage < 1 || nextPage > this.totalPages()) {
      return;
    }
    this.page.set(nextPage);
    this.loadCourses();
  }

  protected openDeleteDialog(course: CourseDto): void {
    this.courseToDelete.set(course);
    this.deleteDialogOpen.set(true);
  }

  protected closeDeleteDialog(): void {
    this.deleteDialogOpen.set(false);
    this.courseToDelete.set(null);
  }

  protected confirmDelete(): void {
    const course = this.courseToDelete();
    if (!course) {
      return;
    }

    this.deleting.set(true);
    this.apiError.set(null);

    this.courseService
      .deleteCourse(course.id)
      .pipe(finalize(() => this.deleting.set(false)))
      .subscribe({
        next: () => {
          this.closeDeleteDialog();
          this.toast.success('Course deleted successfully.');
          this.loadCourses();
        },
        error: (error) => {
          this.closeDeleteDialog();
          this.handleError(error);
        },
      });
  }

  protected viewCourse(course: CourseDto): void {
    void this.router.navigate(['/courses', course.id], { state: { course } });
  }

  protected editCourse(course: CourseDto, event: Event): void {
    event.stopPropagation();
    void this.router.navigate(['/courses', course.id, 'edit'], {
      state: { course },
    });
  }

  protected enrollmentCount(course: CourseDto): number {
    return course.enrollments?.length ?? 0;
  }

  protected moduleCount(course: CourseDto): number {
    return course.modules?.length ?? 0;
  }

  protected assessmentCount(course: CourseDto): number {
    return course.assessments?.length ?? 0;
  }

  protected enrollmentFillPercent(course: CourseDto): number {
    if (!course.maxEnrollments) {
      return 0;
    }
    return Math.min(100, Math.round((this.enrollmentCount(course) / course.maxEnrollments) * 100));
  }

  protected totalModulesOnPage(): number {
    return this.courses().reduce((sum, course) => sum + this.moduleCount(course), 0);
  }

  protected isPublished(course: CourseDto): boolean {
    return course.status?.toLowerCase() === 'published';
  }

  protected isDraft(course: CourseDto): boolean {
    return course.status?.toLowerCase() === 'draft';
  }

  protected coursesEyebrow(): string {
    if (this.isAdmin()) {
      return 'Admin catalog';
    }
    if (this.isInstructor()) {
      return 'Teaching workspace';
    }
    return 'Learning catalog';
  }

  protected coursesSubtitle(): string {
    if (this.isAdmin()) {
      return 'Manage the full course catalog, instructors, capacity, and module structure.';
    }
    if (this.isInstructor()) {
      return 'Review courses you teach, open modules, and track learner engagement.';
    }
    return 'Browse enrolled and available courses, then continue your learning path.';
  }

  protected deleteMessage(): string {
    const title = this.courseToDelete()?.title ?? 'this course';
    return `Delete course "${title}"? This cannot be undone.`;
  }

  private applyNavigationMessage(): void {
    const saved = history.state?.['courseSaved'] as string | undefined;
    if (saved === 'created') {
      this.toast.success('Course created successfully.');
    } else if (saved === 'updated') {
      this.toast.success('Course updated successfully.');
    }
  }

  private applyResponse(response: PagedResponse<CourseDto>): void {
    this.courses.set(response.items);
    this.totalCount.set(response.totalCount);
    this.totalPages.set(response.totalPages);
    this.page.set(response.page);
    this.pageSize.set(response.pageSize);
  }

  private handleError(error: unknown): void {
    this.fieldErrors.set(getApiFieldErrors(error));
    this.apiError.set(getApiErrorMessage(error, 'Failed to load courses.'));
  }
}
