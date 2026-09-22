/** Matches backend FitBook_App.Domain.Enums.AttendanceStatus (byte). */
export enum AttendanceStatus {
  Booked = 1,
  Attended = 2,
  NoShow = 3,
  LateCancel = 4,
}

export const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, string> = {
  [AttendanceStatus.Booked]: 'Booked',
  [AttendanceStatus.Attended]: 'Attended',
  [AttendanceStatus.NoShow]: 'No show',
  [AttendanceStatus.LateCancel]: 'Late cancel',
};
