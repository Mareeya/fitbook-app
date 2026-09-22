export interface DashboardSummaryResponse {
  from: string;
  to: string;
  sessionsHeld: number;
  booked: number;
  attended: number;
  noShows: number;
  capacityOffered: number;
  attendanceRate: number;
  noShowRate: number;
  utilization: number;
  activeMembers: number;
}

export interface TodaySessionResponse {
  sessionId: number;
  startAt: string;
  className: string;
  trainerName: string;
  capacity: number;
  seatsTaken: number;
  checkedInCount: number;
  fillRate: number;
  statusName: string;
  isUnderFilled: boolean;
  isFull: boolean;
}
