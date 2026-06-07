import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';

import {
  ApiFieldErrors,
  getApiErrorMessage,
  getApiFieldErrors,
} from '../../../shared/utils/api-error.util';
import {
  buildModuleForm,
  toCreateModuleDto,
} from '../../../shared/utils/module-form.util';
import { ModuleService } from '../../../services/module.service';
import { ModuleFormComponent } from '../module-form/module-form.component';

@Component({
  selector: 'app-module-create',
  imports: [ModuleFormComponent],
  template: `
    <app-module-form
      [form]="form"
      [courseId]="courseId"
      [courseTitle]="courseTitle()"
      mode="create"
      [submitting]="submitting()"
      [apiError]="apiError()"
      [fieldErrors]="fieldErrors()"
      heading="Add a new module"
      subtitle="Students will see modules in order. The first module starts unlocked."
      submitLabel="Create module"
      (submitted)="submit()"
    />
  `,
})
export class ModuleCreateComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly moduleService = inject(ModuleService);

  protected readonly courseId = Number(this.route.snapshot.paramMap.get('courseId'));
  protected readonly courseTitle = signal<string | null>(null);
  protected readonly form = buildModuleForm(this.fb);
  protected readonly submitting = signal(false);
  protected readonly apiError = signal<string | null>(null);
  protected readonly fieldErrors = signal<ApiFieldErrors>({});

  ngOnInit(): void {
    if (!this.courseId || Number.isNaN(this.courseId)) {
      this.apiError.set('Invalid course.');
      return;
    }

    const course = history.state?.['course'] as { title?: string } | undefined;
    if (course?.title) {
      this.courseTitle.set(course.title);
    }

    const nextIndex = Number(history.state?.['nextOrderIndex'] ?? 0);
    if (!Number.isNaN(nextIndex)) {
      this.form.patchValue({ orderIndex: nextIndex });
    }
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
      .createModule(toCreateModuleDto(this.form.getRawValue(), this.courseId))
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () =>
          void this.router.navigate(['/courses', this.courseId], {
            state: { moduleSaved: 'created' },
          }),
        error: (error) => this.handleError(error),
      });
  }

  private handleError(error: unknown): void {
    this.fieldErrors.set(getApiFieldErrors(error));
    this.apiError.set(getApiErrorMessage(error, 'Failed to create module.'));
  }
}
