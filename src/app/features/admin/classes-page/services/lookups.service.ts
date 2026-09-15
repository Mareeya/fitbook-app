import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { LookupResponse } from '../models/lookup-response.model';

@Injectable({
  providedIn: 'root',
})
export class LookupsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiBaseUrl}/lookups`;

  getByType(type: string): Observable<LookupResponse[]> {
    return this.http.get<LookupResponse[]>(`${this.apiUrl}?type=${type}`);
  }
}
