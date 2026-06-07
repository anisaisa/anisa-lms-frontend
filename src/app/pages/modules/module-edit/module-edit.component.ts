import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { ModuleDto } from '../../../models/module.dto';
import { ModuleService } from '../../../services/module.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { PageAlertComponent } from '../../../shared/components/page-alert/page-alert.component';
import {
  ApiFieldErrors,
  getApiErrorMessage,
  getApiFieldErrors,
} from '../../../shared/utils/api-error.util';
import { buildModuleForm, toUpdateModuleDto } from '../../../shared/utils/module-form.util';
import { ModuleFormComponent } from '../module-form/module-form.component';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-module-edit',
  imports: [ModuleFormComponent, LoadingSpinnerComponent, PageAlertComponent, RouterLink],
  template: `
    @if (loading()) {
      <app-loading-spinner label="Loading module..." />
    } @else if (!moduleFound()) {
      <app-page-alert [message]="apiError() ?? 'Module not found.'" />
      <a class="btn btn--ghost" [routerLink]="['/courses', courseId]">Back to course</a>
    } @else {
      <app-module-form
        [form]="form"
        [courseId]="courseId"
        [courseTitle]="courseTitle()"
        mode="edit"
        [submitting]="submitting()"
        [apiError]="apiError()"
        [fieldErrors]="fieldErrors()"
        heading="Edit module"
        subtitle="Update the title, content, or display order."
        submitLabel="Save changes"
        (submitted)="submit()"
      />
    }
  `,
  styles: `
    .btn {
      display: inline-flex;
      margin-top: 1rem;
      padding: 0.65rem 1rem;
      border-radius: var(--radius-md);
      color: var(--text-muted);
      text-decoration: none;
      border: 1px solid var(--border);
    }
  `,
})
export class ModuleEditComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly moduleService = inject(ModuleService);
  private readonly auth = inject(AuthService);

  protected readonly courseId = Number(this.route.snapshot.paramMap.get('courseId'));
  protected readonly moduleId = Number(this.route.snapshot.paramMap.get('moduleId'));

  protected readonly form = buildModuleForm(this.fb);
  protected readonly courseTitle = signal<string | null>(null);
  protected readonly loading = signal(true);
  protected readonly moduleFound = signal(false);
  protected readonly submitting = signal(false);
  protected readonly apiError = signal<string | null>(null);
  protected readonly fieldErrors = signal<ApiFieldErrors>({});

  ngOnInit(): void {
    if (!this.courseId || Number.isNaN(this.courseId) || !this.moduleId || Number.isNaN(this.moduleId)) {
      this.loading.set(false);
      this.apiError.set('Invalid course or module.');
      return;
    }

    const stateCourse = history.state?.['course'] as { title?: string } | undefined;
    if (stateCourse?.title) {
      this.courseTitle.set(stateCourse.title);
    }

    const stateModule = history.state?.['module'] as ModuleDto | undefined;
    if (stateModule?.id === this.moduleId) {
      this.applyModule(stateModule);
      return;
    }

    const user = this.auth.currentUser;
    if (!user?.id) {
      this.loading.set(false);
      this.apiError.set('You must be signed in.');
      return;
    }

    this.moduleService
      .getModulesForCourse(this.courseId, user.id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (modules) => {
          const found = modules.find((m) => m.id === this.moduleId);
          if (!found) {
            this.moduleFound.set(false);
            this.apiError.set('Module not found.');
            return;
          }
          this.applyModule(found);
        },
        error: (error) => {
          this.moduleFound.set(false);
          this.apiError.set(getApiErrorMessage(error, 'Failed to load module.'));
        },
      });
  }

  protected submit(): void {
    this.apiError.set(null);
    this.fieldErrors.set({});

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);

    this.moduleService
      .updateModule(this.moduleId, toUpdateModuleDto(this.form.getRawValue()))
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () =>
          void this.router.navigate(['/courses', this.courseId], {
            state: { moduleSaved: 'updated' },
          }),
        error: (error) => this.handleError(error),
      });
  }

  private applyModule(module: ModuleDto): void {
    this.moduleFound.set(true);
    this.loading.set(false);
    this.form.patchValue({
      title: module.title,
      content: module.content,
      orderIndex: module.orderIndex,
    });
  }

  private handleError(error: unknown): void {
    this.fieldErrors.set(getApiFieldErrors(error));
    this.apiError.set(getApiErrorMessage(error, 'Failed to update module.'));
  }
}
