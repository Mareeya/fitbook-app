export interface BookingRequest {
  sessionId: number;
}

export interface BookingResponse {
  id: number;
  sessionId: number;
  userId: number;
  memberName: string;
  classId: number;
  className: string;
  trainerName: string;
  startAt: string;
  bookingStatus: string;
  attendanceStatus: string;
  source: string;
  checkedInAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
}

export interface MyBookingsQueryParams {
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}
