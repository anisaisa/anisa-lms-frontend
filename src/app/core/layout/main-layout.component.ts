import { AsyncPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { UserRole } from '../../models/user-role';
import { AuthService } from '../../services/auth.service';
import { NavItem } from '../../shared/nav-item.model';

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
      { label: 'Dashboard', path: '/dashboard' },
      { label: 'Courses', path: '/courses' },
      { label: 'Assessments', path: '/assessments' },
    ];

    const user = this.currentUser();
    if (
      user &&
      this.auth.hasRole(UserRole.Admin, UserRole.Instructor)
    ) {
      items.push({ label: 'Scores', path: '/assessment-scores' });
      items.push({ label: 'Enrollments', path: '/enrollments' });
      items.push({ label: 'Users', path: '/users' });
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
    this.auth.signOut();
    this.closeNav();
  }
}
