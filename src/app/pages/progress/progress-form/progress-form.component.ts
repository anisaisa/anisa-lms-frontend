import { Component, input, output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { CourseDto } from '../../../models/course.dto';
import { ModuleDto } from '../../../models/module.dto';
import { UserListItem } from '../../../models/user.dto';
import { PageAlertComponent } from '../../../shared/components/page-alert/page-alert.component';
import { ApiFieldErrors, getFieldError } from '../../../shared/utils/api-error.util';

@Component({
  selector: 'app-progress-form',
  imports: [ReactiveFormsModule, RouterLink, PageAlertComponent],
  templateUrl: './progress-form.component.html',
  styleUrl: './progress-form.component.css',
})
export class ProgressFormComponent {
  readonly form = input.required<FormGroup>();
  readonly students = input<UserListItem[]>([]);
  readonly courses = input<CourseDto[]>([]);
  readonly modules = input<ModuleDto[]>([]);
  readonly loadingStudents = input(false);
  readonly loadingCourses = input(false);
  readonly loadingModules = input(false);
  readonly submitting = input(false);
  readonly apiError = input<string | null>(null);
  readonly fieldErrors = input<ApiFieldErrors>({});
  readonly heading = input('Record module progress');
  readonly subtitle = input<string | null>(null);
  readonly submitLabel = input('Save progress');

  readonly submitted = output<void>();

  protected fieldError(fieldName: string): string | null {
    return getFieldError(this.fieldErrors(), fieldName);
  }

  protected onSubmit(): void {
    this.submitted.emit();
  }
}
