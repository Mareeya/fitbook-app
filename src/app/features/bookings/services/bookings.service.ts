import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { PagedResponse } from '../../sessions/models/paged-response.model';
import { BookingRequest, BookingResponse, MyBookingsQueryParams } from '../models/booking.models';

@Injectable({
  providedIn: 'root',
})
export class BookingsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiBaseUrl}/bookings`;

  book(sessionId: number): Observable<BookingResponse> {
    const body: BookingRequest = { sessionId };
    return this.http.post<BookingResponse>(this.apiUrl, body);
  }

  getById(id: number): Observable<BookingResponse> {
    return this.http.get<BookingResponse>(`${this.apiUrl}/${id}`);
  }

  getMine(query: MyBookingsQueryParams = {}): Observable<PagedResponse<BookingResponse>> {
    let params = new HttpParams()
      .set('page', String(query.page ?? 1))
      .set('pageSize', String(query.pageSize ?? 50));

    if (query.from) {
      params = params.set('from', query.from);
    }

    if (query.to) {
      params = params.set('to', query.to);
    }

    return this.http.get<PagedResponse<BookingResponse>>(`${this.apiUrl}/me`, { params });
  }

  cancel(id: number): Observable<BookingResponse> {
    return this.http.delete<BookingResponse>(`${this.apiUrl}/${id}`);
  }
}
