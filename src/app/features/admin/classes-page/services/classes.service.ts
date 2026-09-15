import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { GymClassRequest } from '../models/gym-class-request.model';
import { GymClassResponse } from '../models/gym-class-response.model';

@Injectable({
  providedIn: 'root',
})
export class ClassesService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiBaseUrl}/classes`;

  getAll(): Observable<GymClassResponse[]> {
    return this.http.get<GymClassResponse[]>(this.apiUrl);
  }

  getByTrainerUser(userId: number): Observable<GymClassResponse[]> {
    return this.http.get<GymClassResponse[]>(`${this.apiUrl}?trainerUserId=${userId}`);
  }

  create(request: GymClassRequest): Observable<GymClassResponse> {
    return this.http.post<GymClassResponse>(this.apiUrl, request);
  }

  update(id: number, request: GymClassRequest): Observable<GymClassResponse> {
    return this.http.put<GymClassResponse>(`${this.apiUrl}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
