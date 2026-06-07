import { AsyncPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';

import { AdminDashboardDto } from '../../models/admin-dashboard.dto';
import { InstructorDashboardDto } from '../../models/instructor-dashboard.dto';
import { StudentDashboardDto } from '../../models/student-dashboard.dto';
import { UserRole } from '../../models/user-role';
import { AuthService } from '../../services/auth.service';
import { DashboardService } from '../../services/dashboard.service';
import { DashboardSkeletonComponent } from '../../shared/components/dashboard-skeleton/dashboard-skeleton.component';
import { PageAlertComponent } from '../../shared/components/page-alert/page-alert.component';
import { getApiErrorMessage } from '../../shared/utils/api-error.util';
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard.component';
import { InstructorDashboardComponent } from './instructor-dashboard/instructor-dashboard.component';
import { StudentDashboardComponent } from './student-dashboard/student-dashboard.component';

@Component({
  selector: 'app-dashboard',
  imports: [
    AsyncPipe,
    PageAlertComponent,
    DashboardSkeletonComponent,
    AdminDashboardComponent,
    InstructorDashboardComponent,
    StudentDashboardComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly dashboardService = inject(DashboardService);

  protected readonly currentUser$ = this.auth.currentUser$;
  protected readonly loading = signal(true);
  protected readonly apiError = signal<string | null>(null);

  protected readonly adminData = signal<AdminDashboardDto | null>(null);
  protected readonly instructorData = signal<InstructorDashboardDto | null>(null);
  protected readonly studentData = signal<StudentDashboardDto | null>(null);

  protected readonly UserRole = UserRole;

  protected roleForView(role: string): UserRole {
    return this.normalizeRole(role);
  }

  ngOnInit(): void {
    this.loadDashboard();
  }

  protected loadDashboard(): void {
    const user = this.auth.currentUser;
    if (!user) {
      this.loading.set(false);
      return;
    }

    if (!user.email) {
      this.loading.set(false);
      this.apiError.set('Sign out and sign in again to load your dashboard.');
      return;
    }

    this.loading.set(true);
    this.apiError.set(null);
    this.adminData.set(null);
    this.instructorData.set(null);
    this.studentData.set(null);

    const role = this.normalizeRole(user.role);
    const onError = (error: unknown) => {
      this.apiError.set(getApiErrorMessage(error, 'Failed to load dashboard.'));
      this.loading.set(false);
    };

    switch (role) {
      case UserRole.Admin:
        this.dashboardService.getAdminDashboard(user.email).subscribe({
          next: (data) => {
            this.adminData.set(data);
            this.loading.set(false);
          },
          error: onError,
        });
        break;
      case UserRole.Instructor:
        this.dashboardService.getInstructorDashboard(user.email).subscribe({
          next: (data) => {
            this.instructorData.set(data);
            this.loading.set(false);
          },
          error: onError,
        });
        break;
      default:
        this.dashboardService.getStudentDashboard(user.email).subscribe({
          next: (data) => {
            this.studentData.set(data);
            this.loading.set(false);
          },
          error: onError,
        });
        break;
    }
  }

  private normalizeRole(role: string): UserRole {
    const match = Object.values(UserRole).find(
      (value) => value.toLowerCase() === role.toLowerCase(),
    );
    return match ?? UserRole.Student;
  }
}
