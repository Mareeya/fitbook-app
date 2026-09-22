import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { PagedResponse } from '../models/paged-response.model';
import {
  SessionGenerateRequest,
  SessionQueryParams,
  SessionRequest,
  SessionResponse,
  SessionRosterResponse,
} from '../models/session.models';

@Injectable({
  providedIn: 'root',
})
export class SessionsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiBaseUrl}/sessions`;

  getAll(query: SessionQueryParams): Observable<PagedResponse<SessionResponse>> {
    let params = new HttpParams()
      .set('from', query.from)
      .set('to', query.to)
      .set('page', String(query.page ?? 1))
      .set('pageSize', String(query.pageSize ?? 50));

    if (query.classId != null) {
      params = params.set('classId', String(query.classId));
    }

    if (query.trainerId != null) {
      params = params.set('trainerId', String(query.trainerId));
    }

    return this.http.get<PagedResponse<SessionResponse>>(this.apiUrl, { params });
  }

  getById(id: number): Observable<SessionResponse> {
    return this.http.get<SessionResponse>(`${this.apiUrl}/${id}`);
  }

  getRoster(id: number): Observable<SessionRosterResponse> {
    return this.http.get<SessionRosterResponse>(`${this.apiUrl}/${id}/roster`);
  }

  create(request: SessionRequest): Observable<SessionResponse> {
    return this.http.post<SessionResponse>(this.apiUrl, request);
  }

  generate(request: SessionGenerateRequest): Observable<SessionResponse[]> {
    return this.http.post<SessionResponse[]>(`${this.apiUrl}/generate`, request);
  }

  update(id: number, request: SessionRequest): Observable<SessionResponse> {
    return this.http.put<SessionResponse>(`${this.apiUrl}/${id}`, request);
  }

  cancel(id: number): Observable<SessionResponse> {
    return this.http.post<SessionResponse>(`${this.apiUrl}/${id}/cancel`, {});
  }
}
