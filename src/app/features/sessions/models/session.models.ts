export interface SessionResponse {
  id: number;
  classId: number;
  className: string;
  categoryName: string;
  trainerId: number;
  trainerName: string;
  startAt: string;
  capacity: number;
  seatsTaken: number;
  seatsLeft: number;
  checkedInCount: number;
  statusId: number;
  statusName: string;
  createdAt: string;
  updatedAt: string;
}

export interface SessionRequest {
  classId: number;
  startAt: string;
  capacity?: number | null;
}

export interface SessionGenerateRequest {
  classId: number;
  startAt: string;
  untilAt: string;
  repeatEveryDays: number;
  capacity?: number | null;
}

export interface RosterEntryResponse {
  bookingId: number;
  userId: number;
  memberName: string;
  email: string;
  bookingStatus: string;
  attendanceStatus: string;
  source: string;
  checkedInAt: string | null;
  bookedAt: string;
}

export interface SessionRosterResponse {
  session: SessionResponse;
  entries: RosterEntryResponse[];
}

export interface SessionQueryParams {
  from: string;
  to: string;
  classId?: number;
  trainerId?: number;
  page?: number;
  pageSize?: number;
}
