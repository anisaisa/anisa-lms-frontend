import { EnrollmentDto } from '../../models/enrollment.dto';
import {
  ENROLLMENT_STATUS_LABELS,
  ENROLLMENT_STATUSES,
  EnrollmentStatus,
} from '../../models/enrollment-status';

const STATUS_BY_NUMBER: Record<number, EnrollmentStatus> = {
  1: EnrollmentStatus.Active,
  2: EnrollmentStatus.Completed,
  3: EnrollmentStatus.Dropped,
  4: EnrollmentStatus.PendingPayment,
};

export function normalizeEnrollmentStatus(value: unknown): EnrollmentStatus {
  if (typeof value === 'number' && STATUS_BY_NUMBER[value]) {
    return STATUS_BY_NUMBER[value];
  }

  const text = String(value ?? '').trim();
  if (!text) {
    return EnrollmentStatus.Active;
  }

  const match = ENROLLMENT_STATUSES.find(
    (status) => status.toLowerCase() === text.toLowerCase(),
  );
  return match ?? EnrollmentStatus.Active;
}

export function getEnrollmentStatusLabel(status: EnrollmentStatus): string {
  return ENROLLMENT_STATUS_LABELS[status] ?? status;
}

export function getEnrollmentStatusBadgeClass(status: EnrollmentStatus): string {
  switch (status) {
    case EnrollmentStatus.Completed:
      return 'enrollment-badge enrollment-badge--completed';
    case EnrollmentStatus.Dropped:
      return 'enrollment-badge enrollment-badge--dropped';
    case EnrollmentStatus.PendingPayment:
      return 'enrollment-badge enrollment-badge--pending';
    default:
      return 'enrollment-badge enrollment-badge--active';
  }
}

export function filterEnrollments(
  enrollments: EnrollmentDto[],
  search: string,
  statusFilter: EnrollmentStatus | 'all',
): EnrollmentDto[] {
  const query = search.trim().toLowerCase();

  return enrollments.filter((enrollment) => {
    const matchesSearch =
      !query ||
      enrollment.studentFullName.toLowerCase().includes(query) ||
      enrollment.courseTitle.toLowerCase().includes(query);
    const matchesStatus =
      statusFilter === 'all' || enrollment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
}
