import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  login(username: string, password: string): Observable<string> {
    return this.http
      .post<{ token: string; userId: number }>(`${this.base}/auth/login`, { username, password })
      .pipe(
        map((res) => {
          const token = res.token;
          if (token) localStorage.setItem('jwt', token);
          if (res.userId) localStorage.setItem('userId', String(res.userId));
          return token;
        })
      );
  }

  register(username: string, password: string, role?: string) {
    // Note: backend may require admin token to register (unless bootstrap).
    return this.http.post<{ token: string; userId: number }>(`${this.base}/auth/register`, {
      username,
      password,
      role
    });
  }

  logout() {
    localStorage.removeItem('jwt');
  }

  getToken(): string | null {
    return localStorage.getItem('jwt');
  }

  getPayload(): any | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      const payload = token.split('.')[1];
      return JSON.parse(atob(payload));
    } catch {
      return null;
    }
  }

  getUserRoles(): string[] {
    const payload = this.getPayload();
    return Array.isArray(payload?.roles) ? payload.roles : [];
  }

  getRoles(): string[] {
    return this.getUserRoles();
  }

  hasRole(role: string): boolean {
    return this.getUserRoles().includes(role);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  changePassword(currentPassword: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.base}/auth/change-password`, { currentPassword, newPassword });
  }
}
