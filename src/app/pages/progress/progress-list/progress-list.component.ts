import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged, finalize, forkJoin, map, of, switchMap } from 'rxjs';

import { ProgressListItem } from '../../../models/progress-list-item.dto';
import { UserRole } from '../../../models/user-role';
import { User } from '../../../models/user.model';
import { AuthService } from '../../../services/auth.service';
import { CourseService } from '../../../services/course.service';
import { ModuleService } from '../../../services/module.service';
import { ProgressService } from '../../../services/progress.service';
import { UserService } from '../../../services/user.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { PageAlertComponent } from '../../../shared/components/page-alert/page-alert.component';
import { ToastService } from '../../../shared/services/toast.service';
import {
  ApiFieldErrors,
  getApiErrorMessage,
  getApiFieldErrors,
} from '../../../shared/utils/api-error.util';
import {
  ProgressCompletionFilter,
  fetchProgressListItems,
  filterProgressListItems,
  formatProgressCompletionLabel,
} from '../../../shared/utils/progress-list.util';

@Component({
  selector: 'app-progress-list',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    PageAlertComponent,
    LoadingSpinnerComponent,
    ConfirmDialogComponent,
  ],
  templateUrl: './progress-list.component.html',
  styleUrl: './progress-list.component.css',
})
export class ProgressListComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly courseService = inject(CourseService);
  private readonly userService = inject(UserService);
  private readonly moduleService = inject(ModuleService);
  private readonly progressService = inject(ProgressService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  protected readonly loading = signal(true);
  protected readonly deleting = signal(false);
  protected readonly apiError = signal<string | null>(null);
  protected readonly fieldErrors = signal<ApiFieldErrors>({});

  protected readonly allItems = signal<ProgressListItem[]>([]);
  protected readonly deleteDialogOpen = signal(false);
  protected readonly itemToDelete = signal<ProgressListItem | null>(null);

  protected readonly searchControl = new FormControl('', { nonNullable: true });
  protected readonly completionFilterControl = new FormControl<ProgressCompletionFilter>('all', {
    nonNullable: true,
  });

  protected readonly searchQuery = signal('');
  protected readonly completionFilter = signal<ProgressCompletionFilter>('all');

  protected readonly canManageProgress = toSignal(
    this.auth.currentUser$.pipe(
      map(() => this.auth.hasRole(UserRole.Admin, UserRole.Instructor)),
    ),
    { initialValue: this.auth.hasRole(UserRole.Admin, UserRole.Instructor) },
  );

  protected readonly filteredItems = computed(() =>
    filterProgressListItems(this.allItems(), this.searchQuery(), this.completionFilter()),
  );

  protected readonly completedCount = computed(
    () => this.allItems().filter((item) => item.isCompleted).length,
  );

  protected readonly incompleteCount = computed(
    () => this.allItems().filter((item) => !item.isCompleted).length,
  );

  protected readonly formatCompletion = formatProgressCompletionLabel;

  protected pageEyebrow(): string {
    if (this.auth.hasRole(UserRole.Admin)) {
      return 'Admin progress';
    }
    if (this.auth.hasRole(UserRole.Instructor)) {
      return 'Instructor progress';
    }
    return 'Your learning progress';
  }

  protected pageSubtitle(): string {
    if (this.canManageProgress()) {
      return 'Review and manage student module completion records across courses.';
    }
    return 'Track which modules you have completed across your enrolled courses.';
  }

  ngOnInit(): void {
    this.applyNavigationMessage();
    this.loadProgress();

    this.searchControl.valueChanges
      .pipe(debounceTime(250), distinctUntilChanged())
      .subscribe((value) => this.searchQuery.set(value));

    this.completionFilterControl.valueChanges.subscribe((value) =>
      this.completionFilter.set(value),
    );
  }

  protected loadProgress(): void {
    const user = this.auth.currentUser;
    if (!user?.id) {
      this.apiError.set('You must be signed in.');
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    this.apiError.set(null);

    const isStaff = this.canManageProgress();

    forkJoin({
      courses: this.courseService
        .getCourses({ page: 1, pageSize: 500 })
        .pipe(map((response) => response.items)),
      students: isStaff
        ? this.userService.getStudents()
        : of([
            {
              id: user.id,
              fullName: user.fullName,
              email: user.email ?? '',
              role: user.role,
            } satisfies User,
          ]),
    })
      .pipe(
        switchMap(({ courses, students }) => {
          if (!students.length) {
            return of([] as ProgressListItem[]);
          }

          return fetchProgressListItems(
            courses,
            students,
            user.id,
            this.moduleService,
            this.progressService,
          );
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: (items) => this.allItems.set(items),
        error: (error) => this.handleError(error),
      });
  }

  protected editItem(item: ProgressListItem): void {
    void this.router.navigate(['/progress', item.id, 'edit'], {
      state: { progress: item },
    });
  }

  protected openDeleteDialog(item: ProgressListItem, event: MouseEvent): void {
    event.stopPropagation();
    this.itemToDelete.set(item);
    this.deleteDialogOpen.set(true);
  }

  protected closeDeleteDialog(): void {
    this.deleteDialogOpen.set(false);
    this.itemToDelete.set(null);
  }

  protected confirmDelete(): void {
    const item = this.itemToDelete();
    if (!item) {
      return;
    }

    this.deleting.set(true);
    this.progressService
      .deleteProgress(item.id)
      .pipe(finalize(() => this.deleting.set(false)))
      .subscribe({
        next: () => {
          this.closeDeleteDialog();
          this.toast.success('Module progress deleted successfully.');
          this.loadProgress();
        },
        error: (error) => {
          this.closeDeleteDialog();
          this.handleError(error);
        },
      });
  }

  protected deleteMessage(): string {
    const item = this.itemToDelete();
    const student = item?.studentFullName ?? 'this student';
    const module = item?.moduleTitle ?? 'this module';
    return `Delete progress for "${student}" on "${module}"? This cannot be undone.`;
  }

  private applyNavigationMessage(): void {
    const saved = history.state?.['progressSaved'] as string | undefined;
    if (saved === 'created') {
      this.toast.success('Module progress recorded successfully.');
    } else if (saved === 'updated') {
      this.toast.success('Module progress updated successfully.');
    } else if (saved === 'deleted') {
      this.toast.success('Module progress deleted successfully.');
    }
  }

  private handleError(error: unknown): void {
    this.fieldErrors.set(getApiFieldErrors(error));
    this.apiError.set(getApiErrorMessage(error, 'Failed to load module progress.'));
  }
}
