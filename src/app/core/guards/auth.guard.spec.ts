import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AuthService } from '../services/auth.service';
import { authGuard } from './auth.guard';

describe('authGuard', () => {
  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
  });

  afterEach(() => sessionStorage.clear());

  const run = (url: string) =>
    TestBed.runInInjectionContext(() => authGuard({} as ActivatedRouteSnapshot, { url } as RouterStateSnapshot));

  it('sends a signed-out visitor to the login page and remembers where they were going', () => {
    const result = run('/movies');
    expect(result instanceof UrlTree).toBeTrue();
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe('/login?returnUrl=%2Fmovies');
  });

  it('lets a signed-in user through', () => {
    TestBed.inject(AuthService).login(environment.mockUser.username, environment.mockUser.password);
    expect(run('/movies')).toBeTrue();
  });
});
