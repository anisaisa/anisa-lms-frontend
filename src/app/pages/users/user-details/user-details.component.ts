import { Component, OnInit, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize, map } from 'rxjs';

import { User } from '../../../models/user.model';
import { UserRole } from '../../../models/user-role';
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

@Component({
  selector: 'app-user-details',
  imports: [
    RouterLink,
    PageAlertComponent,
    LoadingSpinnerComponent,
    AssignRoleDialogComponent,
    UserRoleBadgeComponent,
  ],
  templateUrl: './user-details.component.html',
  styleUrl: './user-details.component.css',
})
export class UserDetailsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly userService = inject(UserService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  protected readonly user = signal<User | null>(null);
  protected readonly loading = signal(true);
  protected readonly userFound = signal(false);
  protected readonly assigning = signal(false);
  protected readonly apiError = signal<string | null>(null);
  protected readonly fieldErrors = signal<ApiFieldErrors>({});

  protected readonly assignDialogOpen = signal(false);
  protected readonly assignDialogError = signal<string | null>(null);
  protected readonly assignFieldErrors = signal<ApiFieldErrors>({});

  protected readonly canAssignRole = toSignal(
    this.auth.currentUser$.pipe(map(() => this.auth.hasRole(UserRole.Admin))),
    { initialValue: this.auth.hasRole(UserRole.Admin) },
  );

  private userId = '';

  ngOnInit(): void {
    this.userId = this.route.snapshot.paramMap.get('userId') ?? '';
    if (!this.userId) {
      this.apiError.set('Invalid user.');
      this.loading.set(false);
      return;
    }

    const stateUser = history.state?.['user'] as User | undefined;
    if (stateUser?.id === this.userId) {
      this.applyUser(stateUser);
      return;
    }

    this.loadUser();
  }

  protected openAssignDialog(): void {
    this.assignDialogError.set(null);
    this.assignFieldErrors.set({});
    this.assignDialogOpen.set(true);
  }

  protected closeAssignDialog(): void {
    this.assignDialogOpen.set(false);
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
          this.loadUser();
        },
        error: (error) => {
          this.assignFieldErrors.set(getApiFieldErrors(error));
          this.assignDialogError.set(getApiErrorMessage(error, 'Failed to assign role.'));
        },
      });
  }

  private loadUser(): void {
    this.loading.set(true);
    this.apiError.set(null);

    this.userService
      .getUsers()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (users) => {
          const found = users.find((item) => item.id === this.userId);
          if (!found) {
            this.userFound.set(false);
            this.apiError.set('User not found.');
            return;
          }
          this.applyUser(found);
        },
        error: (error) => {
          this.userFound.set(false);
          this.apiError.set(getApiErrorMessage(error, 'Failed to load user.'));
        },
      });
  }

  private applyUser(user: User): void {
    this.user.set(user);
    this.userFound.set(true);
    this.loading.set(false);
  }
}
