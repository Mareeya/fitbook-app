import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { LoginRequest } from '../../models/login-request.model';
import { LoginResponse } from '../../models/login-response.model';
import { UserRole } from '../../models/user-role.enum';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly loginUrl = 'http://localhost:5226/api/auth/login';

  login(request: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(this.loginUrl, request);
  }

  saveUser(user: LoginResponse): void {
    localStorage.setItem('fitbookUser', JSON.stringify(user));
  }

  getUser(): LoginResponse | null {
    const savedUser = localStorage.getItem('fitbookUser');
    return savedUser ? JSON.parse(savedUser) : null;
  }

  logout(): void {
    localStorage.removeItem('fitbookUser');
  }

  isAdmin(): boolean {
    return this.getUser()?.role === UserRole.Admin;
  }
}
