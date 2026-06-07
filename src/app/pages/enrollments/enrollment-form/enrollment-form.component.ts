import { Component, input, output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { CourseDto } from '../../../models/course.dto';
import {
  ENROLLMENT_STATUSES,
  ENROLLMENT_STATUS_LABELS,
  EnrollmentStatus,
} from '../../../models/enrollment-status';
import { UserListItem } from '../../../models/user.dto';
import { PageAlertComponent } from '../../../shared/components/page-alert/page-alert.component';
import { ApiFieldErrors, getFieldError } from '../../../shared/utils/api-error.util';

@Component({
  selector: 'app-enrollment-form',
  imports: [ReactiveFormsModule, RouterLink, PageAlertComponent],
  templateUrl: './enrollment-form.component.html',
  styleUrl: './enrollment-form.component.css',
})
export class EnrollmentFormComponent {
  readonly form = input.required<FormGroup>();
  readonly courses = input<CourseDto[]>([]);
  readonly students = input<UserListItem[]>([]);
  readonly loadingCourses = input(false);
  readonly loadingStudents = input(false);
  readonly submitting = input(false);
  readonly apiError = input<string | null>(null);
  readonly fieldErrors = input<ApiFieldErrors>({});
  readonly heading = input('Enroll student');
  readonly subtitle = input<string | null>(null);
  readonly submitLabel = input('Create enrollment');

  readonly submitted = output<void>();

  protected readonly statuses = ENROLLMENT_STATUSES;
  protected readonly statusLabels = ENROLLMENT_STATUS_LABELS;

  protected fieldError(fieldName: string): string | null {
    return getFieldError(this.fieldErrors(), fieldName);
  }

  protected onSubmit(): void {
    this.submitted.emit();
  }

  protected statusValue(status: EnrollmentStatus): EnrollmentStatus {
    return status;
  }
}
