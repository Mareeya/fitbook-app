import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { TrainerRequest } from '../../../models/trainer-request.model';
import { TrainerResponse } from '../../../models/trainer-response.model';

@Injectable({
  providedIn: 'root',
})
export class TrainersService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:5226/api/trainers';

  getAll(): Observable<TrainerResponse[]> {
    return this.http.get<TrainerResponse[]>(this.apiUrl);
  }

  create(request: TrainerRequest): Observable<TrainerResponse> {
    return this.http.post<TrainerResponse>(this.apiUrl, request);
  }

  update(id: number, request: TrainerRequest): Observable<TrainerResponse> {
    return this.http.put<TrainerResponse>(`${this.apiUrl}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
