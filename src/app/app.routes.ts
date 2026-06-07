import { Routes } from '@angular/router';

import { MainLayoutComponent } from './core/layout/main-layout.component';
import { authGuard } from './guards/auth.guard';
import { guestGuard } from './guards/guest.guard';
import { roleGuard } from './guards/role.guard';
import { UserRole } from './models/user-role';

const moduleManageRoles = [UserRole.Admin, UserRole.Instructor];
const assessmentManageRoles = [UserRole.Admin, UserRole.Instructor];
const assessmentScoreManageRoles = [UserRole.Admin, UserRole.Instructor];
const enrollmentManageRoles = [UserRole.Admin, UserRole.Instructor];
const userManageRoles = [UserRole.Admin, UserRole.Instructor];

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./pages/register/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'courses',
        loadComponent: () =>
          import('./pages/courses/course-list/course-list.component').then(
            (m) => m.CourseListComponent,
          ),
      },
      {
        path: 'courses/new',
        canActivate: [roleGuard],
        data: { roles: [UserRole.Admin] },
        loadComponent: () =>
          import('./pages/courses/course-create/course-create.component').then(
            (m) => m.CourseCreateComponent,
          ),
      },
      {
        path: 'courses/:courseId/edit',
        canActivate: [roleGuard],
        data: { roles: [UserRole.Admin] },
        loadComponent: () =>
          import('./pages/courses/course-edit/course-edit.component').then(
            (m) => m.CourseEditComponent,
          ),
      },
      {
        path: 'courses/:courseId',
        loadComponent: () =>
          import('./pages/courses/course-details/course-details.component').then(
            (m) => m.CourseDetailsComponent,
          ),
      },
      {
        path: 'courses/:courseId/modules/new',
        canActivate: [roleGuard],
        data: { roles: moduleManageRoles },
        loadComponent: () =>
          import('./pages/modules/module-create/module-create.component').then(
            (m) => m.ModuleCreateComponent,
          ),
      },
      {
        path: 'courses/:courseId/modules/:moduleId/edit',
        canActivate: [roleGuard],
        data: { roles: moduleManageRoles },
        loadComponent: () =>
          import('./pages/modules/module-edit/module-edit.component').then(
            (m) => m.ModuleEditComponent,
          ),
      },
      {
        path: 'courses/:courseId/modules/:moduleId',
        loadComponent: () =>
          import('./pages/modules/module-detail/module-detail.component').then(
            (m) => m.ModuleDetailComponent,
          ),
      },
      {
        path: 'assessments',
        loadComponent: () =>
          import('./pages/assessments/assessment-list/assessment-list.component').then(
            (m) => m.AssessmentListComponent,
          ),
      },
      {
        path: 'assessments/new',
        canActivate: [roleGuard],
        data: { roles: assessmentManageRoles },
        loadComponent: () =>
          import('./pages/assessments/assessment-create/assessment-create.component').then(
            (m) => m.AssessmentCreateComponent,
          ),
      },
      {
        path: 'assessments/:assessmentId/edit',
        canActivate: [roleGuard],
        data: { roles: assessmentManageRoles },
        loadComponent: () =>
          import('./pages/assessments/assessment-edit/assessment-edit.component').then(
            (m) => m.AssessmentEditComponent,
          ),
      },
      {
        path: 'assessments/:assessmentId/results',
        canActivate: [roleGuard],
        data: { roles: assessmentManageRoles },
        loadComponent: () =>
          import('./pages/assessments/assessment-results/assessment-results.component').then(
            (m) => m.AssessmentResultsComponent,
          ),
      },
      {
        path: 'assessment-scores',
        canActivate: [roleGuard],
        data: { roles: assessmentScoreManageRoles },
        loadComponent: () =>
          import('./pages/assessment-scores/assessment-score-list/assessment-score-list.component').then(
            (m) => m.AssessmentScoreListComponent,
          ),
      },
      {
        path: 'assessment-scores/new',
        canActivate: [roleGuard],
        data: { roles: assessmentScoreManageRoles },
        loadComponent: () =>
          import('./pages/assessment-scores/assessment-score-create/assessment-score-create.component').then(
            (m) => m.AssessmentScoreCreateComponent,
          ),
      },
      {
        path: 'assessment-scores/:scoreId/edit',
        canActivate: [roleGuard],
        data: { roles: assessmentScoreManageRoles },
        loadComponent: () =>
          import('./pages/assessment-scores/assessment-score-edit/assessment-score-edit.component').then(
            (m) => m.AssessmentScoreEditComponent,
          ),
      },
      {
        path: 'enrollments',
        canActivate: [roleGuard],
        data: { roles: enrollmentManageRoles },
        loadComponent: () =>
          import('./pages/enrollments/enrollment-list/enrollment-list.component').then(
            (m) => m.EnrollmentListComponent,
          ),
      },
      {
        path: 'enrollments/new',
        canActivate: [roleGuard],
        data: { roles: enrollmentManageRoles },
        loadComponent: () =>
          import('./pages/enrollments/enrollment-create/enrollment-create.component').then(
            (m) => m.EnrollmentCreateComponent,
          ),
      },
      {
        path: 'enrollments/:enrollmentId',
        canActivate: [roleGuard],
        data: { roles: enrollmentManageRoles },
        loadComponent: () =>
          import('./pages/enrollments/enrollment-details/enrollment-details.component').then(
            (m) => m.EnrollmentDetailsComponent,
          ),
      },
      {
        path: 'users',
        canActivate: [roleGuard],
        data: { roles: userManageRoles },
        loadComponent: () =>
          import('./pages/users/user-list/user-list.component').then((m) => m.UserListComponent),
      },
      {
        path: 'users/:userId',
        canActivate: [roleGuard],
        data: { roles: userManageRoles },
        loadComponent: () =>
          import('./pages/users/user-details/user-details.component').then(
            (m) => m.UserDetailsComponent,
          ),
      },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
