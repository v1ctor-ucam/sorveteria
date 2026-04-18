import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AuthResponse, UserRole } from './api.types';

interface TokenPayload {
  sub?: string;
  nameid?: string;
  role?: UserRole;
  exp?: number;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiBase = '/api';
  private readonly storageKey = 'fideliza.auth';
  private readonly authState = signal<AuthResponse | null>(this.readFromStorage());
  private readonly userIdState = signal<string | null>(this.readUserIdFromToken(this.authState()?.token ?? null));

  readonly token = computed(() => this.authState()?.token ?? null);
  readonly role = computed(() => this.authState()?.role ?? null);
  readonly userId = computed(() => this.userIdState());
  readonly isLoggedIn = computed(() => !!this.token());

  constructor(private readonly http: HttpClient) {}

  async login(login: string, password: string): Promise<AuthResponse> {
    const response = await firstValueFrom(
      this.http.post<AuthResponse>(`${this.apiBase}/auth/login`, { login, password })
    );

    this.setSession(response);
    return response;
  }

  async registerCustomer(fullName: string, email: string, phone: string, password: string): Promise<AuthResponse> {
    const response = await firstValueFrom(
      this.http.post<AuthResponse>(`${this.apiBase}/auth/register-customer`, {
        fullName,
        email,
        phone,
        password
      })
    );

    this.setSession(response);
    return response;
  }

  logout(): void {
    this.authState.set(null);
    this.userIdState.set(null);
    localStorage.removeItem(this.storageKey);
  }

  private setSession(response: AuthResponse): void {
    this.authState.set(response);
    this.userIdState.set(this.readUserIdFromToken(response.token));
    localStorage.setItem(this.storageKey, JSON.stringify(response));
  }

  private readFromStorage(): AuthResponse | null {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) {
        return null;
      }

      const parsed = JSON.parse(raw) as AuthResponse;
      return parsed?.token ? parsed : null;
    } catch {
      return null;
    }
  }

  private readUserIdFromToken(token: string | null): string | null {
    if (!token) {
      return null;
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const payloadRaw = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const payloadJson = decodeURIComponent(
      atob(payloadRaw)
        .split('')
        .map((c) => `%${('00' + c.charCodeAt(0).toString(16)).slice(-2)}`)
        .join('')
    );

    const payload = JSON.parse(payloadJson) as TokenPayload;
    return payload.nameid ?? payload.sub ?? null;
  }
}
