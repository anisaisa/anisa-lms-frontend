import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, catchError, finalize, of, tap } from 'rxjs';

import { AUTH_TOKEN_KEY, AUTH_USER_KEY } from '../core/constants/auth-storage.constants';
import { AuthUser } from '../models/auth-user.model';
import { LoginDto } from '../models/login.dto';
import { RegisterDto } from '../models/register.dto';
import { UserRole } from '../models/user-role';
import { RegisterResponse } from '../models/register-response.model';
import { UserDto } from '../models/user.dto';
import { UserService } from './user.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly userService = inject(UserService);
  private readonly router = inject(Router);

  private readonly currentUserSubject = new BehaviorSubject<AuthUser | null>(null);
  readonly currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    this.restoreSession();
  }

  get currentUser(): AuthUser | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    return !!this.getToken() && !!this.currentUser;
  }

  getToken(): string | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }
    return localStorage.getItem(AUTH_TOKEN_KEY);
  }

  hasRole(...roles: UserRole[]): boolean {
    const user = this.currentUser;
    if (!user) {
      return false;
    }

    const userRole = user.role.toLowerCase();
    return roles.some((role) => role.toLowerCase() === userRole);
  }

  /** After login, pick a route the current user is allowed to open. */
  getPostLoginUrl(returnUrl: string | null | undefined): string {
    const fallback = '/dashboard';
    if (!returnUrl || returnUrl === '/login' || returnUrl === '/register') {
      return fallback;
    }

    const path = returnUrl.split('?')[0].split('#')[0];

    if (path.startsWith('/users') && !this.hasRole(UserRole.Admin, UserRole.Instructor)) {
      return fallback;
    }

    if (path.startsWith('/enrollments') && !this.hasRole(UserRole.Admin, UserRole.Instructor)) {
      return fallback;
    }

    if (
      (path === '/courses/new' || path.endsWith('/edit')) &&
      !this.hasRole(UserRole.Admin)
    ) {
      return fallback;
    }

    if (
      path.startsWith('/assessments') &&
      (path.includes('/edit') || path.includes('/results') || path === '/assessments/new') &&
      !this.hasRole(UserRole.Admin, UserRole.Instructor)
    ) {
      return fallback;
    }

    if (path.includes('/modules/new') || path.includes('/modules/') && path.includes('/edit')) {
      if (!this.hasRole(UserRole.Admin, UserRole.Instructor)) {
        return fallback;
      }
    }

    return returnUrl;
  }

  login(dto: LoginDto): Observable<UserDto> {
    return this.userService.login(dto).pipe(tap((user) => this.setSession(user, dto.email)));
  }

  register(dto: RegisterDto): Observable<RegisterResponse> {
    return this.userService.register(dto);
  }

  logout(redirectToLogin = true): Observable<void> {
    return this.userService.logout().pipe(
      catchError(() => of(void 0)),
      finalize(() => {
        this.clearSession();
        if (redirectToLogin) {
          void this.router.navigate(['/login']);
        }
      }),
    );
  }

  signOut(): void {
    if (!this.isAuthenticated()) {
      this.clearSession();
      void this.router.navigate(['/login']);
      return;
    }

    this.logout().subscribe();
  }

  private setSession(user: UserDto, email?: string): void {
    const authUser: AuthUser = {
      id: user.id,
      role: user.role,
      fullName: user.fullName,
      email,
    };

    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(AUTH_TOKEN_KEY, user.token);
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(authUser));
    }

    this.currentUserSubject.next(authUser);
  }

  private restoreSession(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    const storedUser = localStorage.getItem(AUTH_USER_KEY);

    if (!token || !storedUser) {
      this.clearSession(false);
      return;
    }

    try {
      const user = JSON.parse(storedUser) as AuthUser;
      if (!user?.id || !user?.role || !user?.fullName) {
        this.clearSession(false);
        return;
      }
      this.currentUserSubject.next(user);
    } catch {
      this.clearSession(false);
    }
  }

  private clearSession(emitNull = true): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(AUTH_USER_KEY);
    }

    if (emitNull) {
      this.currentUserSubject.next(null);
    }
  }
}
