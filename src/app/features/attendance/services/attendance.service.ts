import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { SessionRosterResponse } from '../../sessions/models/session.models';
import { AttendanceMarkRequest } from '../models/attendance.models';

@Injectable({
  providedIn: 'root',
})
export class AttendanceService {
  private readonly http = inject(HttpClient);
  private readonly apiBase = environment.apiBaseUrl;

  markSession(sessionId: number, request: AttendanceMarkRequest): Observable<SessionRosterResponse> {
    return this.http.post<SessionRosterResponse>(
      `${this.apiBase}/sessions/${sessionId}/attendance`,
      request,
    );
  }
}
