import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import {
  DashboardSummaryResponse,
  TodaySessionResponse,
} from '../models/dashboard.models';

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiBaseUrl}/dashboard`;

  getSummary(from?: Date, to?: Date): Observable<DashboardSummaryResponse> {
    let params = new HttpParams();
    if (from) {
      params = params.set('from', from.toISOString());
    }
    if (to) {
      params = params.set('to', to.toISOString());
    }
    return this.http.get<DashboardSummaryResponse>(`${this.apiUrl}/summary`, { params });
  }

  getToday(date?: Date): Observable<TodaySessionResponse[]> {
    let params = new HttpParams();
    if (date) {
      params = params.set('date', date.toISOString());
    }
    return this.http.get<TodaySessionResponse[]>(`${this.apiUrl}/today`, { params });
  }
}
