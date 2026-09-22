import { AttendanceStatus } from '../../sessions/models/attendance-status.enum';

export interface AttendanceMarkItem {
  bookingId: number;
  status: AttendanceStatus;
}

export interface AttendanceMarkRequest {
  marks: AttendanceMarkItem[];
}
