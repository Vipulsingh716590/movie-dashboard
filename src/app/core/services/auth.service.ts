import { Injectable, computed, signal } from '@angular/core';
import { environment } from '../../../environments/environment';

const STORAGE_KEY = 'movieflix-dashboard.session';

const readSession = (): string | null => {
  try {
    return sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
};

/**
 * Mock sign-in: one user, checked in the browser against environment.mockUser. It keeps casual visitors out of the
 * screens but is NOT security (the password is in the page source); replace it with a real login before going live.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private state = signal<string | null>(readSession());

  /** Display name of the signed-in user, or null. */
  readonly user = this.state.asReadonly();
  readonly loggedIn = computed(() => this.state() !== null);

  login(username: string, password: string): boolean {
    const mock = environment.mockUser;
    if (username.trim() !== mock.username || password !== mock.password) return false;
    this.state.set(mock.name);
    try {
      sessionStorage.setItem(STORAGE_KEY, mock.name);
    } catch {
      /* private mode: the session simply lasts until the page is reloaded */
    }
    return true;
  }

  logout(): void {
    this.state.set(null);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* nothing stored */
    }
  }
}
