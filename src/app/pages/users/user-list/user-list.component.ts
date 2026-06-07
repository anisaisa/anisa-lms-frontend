import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, finalize, map } from 'rxjs';

import { User } from '../../../models/user.model';
import { USER_ROLES, UserRole } from '../../../models/user-role';
import { AuthService } from '../../../services/auth.service';
import { UserService } from '../../../services/user.service';
import { AssignRoleDialogComponent } from '../../../shared/components/assign-role-dialog/assign-role-dialog.component';
import { ToastService } from '../../../shared/services/toast.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { PageAlertComponent } from '../../../shared/components/page-alert/page-alert.component';
import { UserRoleBadgeComponent } from '../../../shared/components/user-role-badge/user-role-badge.component';
import {
  ApiFieldErrors,
  getApiErrorMessage,
  getApiFieldErrors,
} from '../../../shared/utils/api-error.util';
import { filterUsers } from '../../../shared/utils/user.util';

@Component({
  selector: 'app-user-list',
  imports: [
    ReactiveFormsModule,
    PageAlertComponent,
    LoadingSpinnerComponent,
    AssignRoleDialogComponent,
    UserRoleBadgeComponent,
  ],
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.css',
})
export class UserListComponent implements OnInit {
  private readonly userService = inject(UserService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  protected readonly loading = signal(true);
  protected readonly assigning = signal(false);
  protected readonly apiError = signal<string | null>(null);
  protected readonly fieldErrors = signal<ApiFieldErrors>({});

  protected readonly allUsers = signal<User[]>([]);
  protected readonly assignDialogOpen = signal(false);
  protected readonly userToAssign = signal<User | null>(null);
  protected readonly assignDialogError = signal<string | null>(null);
  protected readonly assignFieldErrors = signal<ApiFieldErrors>({});

  protected readonly canAssignRole = toSignal(
    this.auth.currentUser$.pipe(map(() => this.auth.hasRole(UserRole.Admin))),
    { initialValue: this.auth.hasRole(UserRole.Admin) },
  );

  protected readonly nameSearchControl = new FormControl('', { nonNullable: true });
  protected readonly emailSearchControl = new FormControl('', { nonNullable: true });
  protected readonly roleFilterControl = new FormControl<UserRole | 'all'>('all', {
    nonNullable: true,
  });

  protected readonly nameQuery = signal('');
  protected readonly emailQuery = signal('');
  protected readonly roleFilter = signal<UserRole | 'all'>('all');

  protected readonly roles = USER_ROLES;

  protected readonly filteredUsers = computed(() =>
    filterUsers(
      this.allUsers(),
      this.nameQuery(),
      this.emailQuery(),
      this.roleFilter(),
    ),
  );

  ngOnInit(): void {
    this.applyNavigationMessage();
    this.loadUsers();

    this.nameSearchControl.valueChanges
      .pipe(debounceTime(250), distinctUntilChanged())
      .subscribe((value) => this.nameQuery.set(value));

    this.emailSearchControl.valueChanges
      .pipe(debounceTime(250), distinctUntilChanged())
      .subscribe((value) => this.emailQuery.set(value));

    this.roleFilterControl.valueChanges.subscribe((value) => this.roleFilter.set(value));
  }

  protected loadUsers(): void {
    this.loading.set(true);
    this.apiError.set(null);

    this.userService
      .getUsers()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (users) => this.allUsers.set(users),
        error: (error) => this.handleLoadError(error),
      });
  }

  protected viewUser(user: User): void {
    void this.router.navigate(['/users', user.id], { state: { user } });
  }

  protected openAssignDialog(user: User, event: MouseEvent): void {
    event.stopPropagation();
    this.userToAssign.set(user);
    this.assignDialogError.set(null);
    this.assignFieldErrors.set({});
    this.assignDialogOpen.set(true);
  }

  protected closeAssignDialog(): void {
    this.assignDialogOpen.set(false);
    this.userToAssign.set(null);
    this.assignDialogError.set(null);
    this.assignFieldErrors.set({});
  }

  protected confirmAssignRole(payload: { userId: string; roleName: string }): void {
    this.assigning.set(true);
    this.assignDialogError.set(null);
    this.assignFieldErrors.set({});

    this.userService
      .assignRole(payload)
      .pipe(finalize(() => this.assigning.set(false)))
      .subscribe({
        next: () => {
          this.closeAssignDialog();
          this.toast.success('Role updated successfully.');
          this.loadUsers();
        },
        error: (error) => {
          this.assignFieldErrors.set(getApiFieldErrors(error));
          this.assignDialogError.set(getApiErrorMessage(error, 'Failed to assign role.'));
        },
      });
  }

  protected roleFilterValue(role: UserRole): UserRole {
    return role;
  }

  private applyNavigationMessage(): void {
    const saved = history.state?.['userSaved'] as string | undefined;
    if (saved === 'role-assigned') {
      this.toast.success('Role updated successfully.');
    }
  }

  private handleLoadError(error: unknown): void {
    this.fieldErrors.set(getApiFieldErrors(error));
    this.apiError.set(getApiErrorMessage(error, 'Failed to load users.'));
  }
}
