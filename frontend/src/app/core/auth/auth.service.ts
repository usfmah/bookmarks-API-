import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, catchError, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, UpdateUserPayload, User } from '../models/models';

const TOKEN_KEY = 'folio.access_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  /** In-memory copy of the bearer token; sessionStorage survives reloads within the tab only. */
  readonly token = signal<string | null>(sessionStorage.getItem(TOKEN_KEY));
  readonly currentUser = signal<User | null>(null);
  readonly restoreAttempted = signal(false);
  readonly isAuthenticated = computed(
    () => this.token() !== null && this.currentUser() !== null,
  );

  /** Called once at app start: if a token exists in this tab's session storage, load the profile. */
  restoreSession(): Observable<User | null> {
    if (!this.token()) {
      this.restoreAttempted.set(true);
      return of(null);
    }
    return this.fetchMe().pipe(
      catchError(() => {
        this.clearSession();
        return of(null);
      }),
      tap(() => this.restoreAttempted.set(true)),
    );
  }

  signIn(email: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/signin`, { email, password })
      .pipe(tap((res) => this.setSession(res.access_token)));
  }

  signUp(email: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/signup`, { email, password })
      .pipe(tap((res) => this.setSession(res.access_token)));
  }

  fetchMe(): Observable<User> {
    return this.http
      .get<User>(`${environment.apiUrl}/users/me`)
      .pipe(tap((user) => this.currentUser.set(user)));
  }

  updateProfile(payload: UpdateUserPayload): Observable<User> {
    return this.http
      .patch<User>(`${environment.apiUrl}/users`, payload)
      .pipe(tap((user) => this.currentUser.set(user)));
  }

  /** Clears local session state. JWTs are stateless server-side; there is no server revoke endpoint. */
  logout(): void {
    this.clearSession();
    void this.router.navigate(['/sign-in']);
  }

  /** Called by the HTTP interceptor when the server rejects our token. */
  handleUnauthorized(): void {
    if (!this.token()) return;
    this.clearSession();
    void this.router.navigate(['/sign-in'], { queryParams: { reason: 'session-expired' } });
  }

  private setSession(token: string): void {
    sessionStorage.setItem(TOKEN_KEY, token);
    this.token.set(token);
  }

  private clearSession(): void {
    sessionStorage.removeItem(TOKEN_KEY);
    this.token.set(null);
    this.currentUser.set(null);
  }
}
