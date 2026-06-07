export enum EnrollmentStatus {
  Active = 'Active',
  Completed = 'Completed',
  Dropped = 'Dropped',
  PendingPayment = 'PendingPayment',
}

export const ENROLLMENT_STATUSES: EnrollmentStatus[] = [
  EnrollmentStatus.Active,
  EnrollmentStatus.Completed,
  EnrollmentStatus.Dropped,
  EnrollmentStatus.PendingPayment,
];

export const ENROLLMENT_STATUS_LABELS: Record<EnrollmentStatus, string> = {
  [EnrollmentStatus.Active]: 'Active',
  [EnrollmentStatus.Completed]: 'Completed',
  [EnrollmentStatus.Dropped]: 'Dropped',
  [EnrollmentStatus.PendingPayment]: 'Pending payment',
};
