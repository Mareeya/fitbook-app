import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { LoginRequest } from '../models/login-request.model';
import { LoginResponse } from '../models/login-response.model';
import { RegisterRequest } from '../models/register-request.model';
import { UserRole } from '../models/user-role.enum';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly authUrl = `${environment.apiBaseUrl}/auth`;
  private readonly storageKey = 'fitbookUser';

  login(request: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.authUrl}/login`, request);
  }

  register(request: RegisterRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.authUrl}/register`, request);
  }

  saveUser(user: LoginResponse): void {
    localStorage.setItem(this.storageKey, JSON.stringify(user));
  }

  getUser(): LoginResponse | null {
    const savedUser = localStorage.getItem(this.storageKey);
    if (!savedUser) {
      return null;
    }

    try {
      return JSON.parse(savedUser) as LoginResponse;
    } catch {
      localStorage.removeItem(this.storageKey);
      return null;
    }
  }

  logout(): void {
    localStorage.removeItem(this.storageKey);
  }

  isLoggedIn(): boolean {
    return this.getUser() !== null;
  }

  isAdmin(): boolean {
    return this.getUser()?.role === UserRole.Admin;
  }

  isTrainer(): boolean {
    return this.getUser()?.role === UserRole.Trainer;
  }

  isMember(): boolean {
    return this.getUser()?.role === UserRole.Member;
  }

  getHomeRoute(): string {
    const role = this.getUser()?.role;

    if (role === UserRole.Admin) {
      return '/admin/trainers';
    }

    if (role === UserRole.Trainer) {
      return '/trainer';
    }

    if (role === UserRole.Member) {
      return '/home';
    }

    return '/login';
  }
}
