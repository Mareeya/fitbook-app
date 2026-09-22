import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, Observable, of, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { LoginRequest } from '../models/login-request.model';
import { LoginResponse } from '../models/login-response.model';
import { MeResponse } from '../models/me-response.model';
import { RegisterRequest } from '../models/register-request.model';
import { UserRole } from '../models/user-role.enum';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly authUrl = `${environment.apiBaseUrl}/auth`;
  private readonly storageKey = 'fitbookUser';

  readonly currentUser = signal<LoginResponse | null>(this.readStoredUser());
  readonly isLoggedIn = computed(() => !!this.currentUser()?.token);

  login(request: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.authUrl}/login`, request);
  }

  register(request: RegisterRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.authUrl}/register`, request);
  }

  refreshProfile(): Observable<MeResponse | null> {
    if (!this.currentUser()?.token) {
      return of(null);
    }

    return this.http.get<MeResponse>(`${this.authUrl}/me`).pipe(
      tap((me) => this.applyProfile(me)),
      catchError(() => of(null)),
    );
  }

  /** Persist login/register response, then load `/me` (e.g. trainerId) before routing. */
  completeSignIn(user: LoginResponse): Observable<MeResponse | null> {
    this.saveUser(user);
    return this.refreshProfile();
  }

  saveUser(user: LoginResponse): void {
    localStorage.setItem(this.storageKey, JSON.stringify(user));
    this.currentUser.set(user);
  }

  getUser(): LoginResponse | null {
    return this.currentUser();
  }

  logout(): void {
    localStorage.removeItem(this.storageKey);
    this.currentUser.set(null);
  }

  canManage(): boolean {
    const role = this.currentUser()?.role;
    return this.isLoggedIn() && role === UserRole.Admin;
  }

  isAdmin(): boolean {
    return this.canManage();
  }

  isTrainer(): boolean {
    return this.isLoggedIn() && this.currentUser()?.role === UserRole.Trainer;
  }

  isMember(): boolean {
    return this.isLoggedIn() && this.currentUser()?.role === UserRole.Member;
  }

  getHomeRoute(): string {
    const user = this.currentUser();
    if (!user?.token) {
      return '/login';
    }

    if (user.role === UserRole.Admin) {
      return '/admin/dashboard';
    }

    if (user.role === UserRole.Trainer) {
      return '/trainer';
    }

    if (user.role === UserRole.Member) {
      return '/home';
    }

    return '/login';
  }

  private applyProfile(me: MeResponse): void {
    const existing = this.currentUser();
    if (!existing) {
      return;
    }

    this.saveUser({
      ...existing,
      id: me.id,
      name: me.name,
      email: me.email,
      role: me.role,
      trainerId: me.trainerId,
    });
  }

  private readStoredUser(): LoginResponse | null {
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
}
