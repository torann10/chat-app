import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, tap } from 'rxjs';

export interface CurrentUser {
  id: number;
  email: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  
  private apiUrl = 'http://localhost:3000/auth';
  
  private loggedIn = new BehaviorSubject<boolean>(this.hasToken());
  isLoggedIn$ = this.loggedIn.asObservable();

  readonly currentUser = signal<CurrentUser | null>(this.decodeToken());

  signup(userData: any) {
    return this.http.post<{token: string, message: string}>(`${this.apiUrl}/signup`, userData).pipe(
      tap(res => this.handleAuthentication(res.token))
    );
  }

  login(credentials: any) {
    return this.http.post<{token: string}>(`${this.apiUrl}/login`, credentials).pipe(
      tap(res => this.handleAuthentication(res.token))
    );
  }

  handleAuthentication(token: string) {
    localStorage.setItem('jwt_token', token);
    this.loggedIn.next(true);
    this.currentUser.set(this.decodeToken());
  }

  logout() {
    localStorage.removeItem('jwt_token');
    this.loggedIn.next(false);
    this.currentUser.set(null);
    this.router.navigate(['/auth/login']);
  }

  getToken(): string | null {
    return localStorage.getItem('jwt_token');
  }

  private hasToken(): boolean {
    return !!localStorage.getItem('jwt_token');
  }

  private decodeToken(): CurrentUser | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      const payload = JSON.parse(
        atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))
      );
      return { id: payload.id, email: payload.email };
    } catch {
      return null;
    }
  }
}
