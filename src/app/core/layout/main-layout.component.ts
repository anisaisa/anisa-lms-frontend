import { AsyncPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { UserRole } from '../../models/user-role';
import { AuthService } from '../../services/auth.service';
import { NavIcon, NavItem } from '../../shared/nav-item.model';

@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, AsyncPipe],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.css',
})
export class MainLayoutComponent {
  private readonly auth = inject(AuthService);

  protected readonly navOpen = signal(false);
  protected readonly currentUser$ = this.auth.currentUser$;

  private readonly currentUser = toSignal(this.auth.currentUser$, {
    initialValue: this.auth.currentUser,
  });

  protected readonly navItems = computed<NavItem[]>(() => {
    const items: NavItem[] = [
      { label: 'Dashboard', path: '/dashboard', icon: 'dashboard' },
      { label: 'Courses', path: '/courses', icon: 'courses' },
      { label: 'Progress', path: '/progress', icon: 'progress' },
      { label: 'Assessments', path: '/assessments', icon: 'assessments' },
    ];

    const user = this.currentUser();
    if (user && this.auth.hasRole(UserRole.Admin, UserRole.Instructor)) {
      items.push({ label: 'Scores', path: '/assessment-scores', icon: 'scores' });
      items.push({ label: 'Enrollments', path: '/enrollments', icon: 'enrollments' });
      items.push({ label: 'Users', path: '/users', icon: 'users' });
    }

    return items;
  });

  protected toggleNav(): void {
    this.navOpen.update((open) => !open);
  }

  protected closeNav(): void {
    this.navOpen.set(false);
  }

  protected logout(): void {
    this.closeNav();
    this.auth.signOut();
  }

  protected trackNavIcon(icon: NavIcon): NavIcon {
    return icon;
  }
}
