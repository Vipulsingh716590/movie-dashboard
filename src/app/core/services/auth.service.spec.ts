import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

describe('AuthService (mock login)', () => {
  let auth: AuthService;

  beforeEach(() => {
    sessionStorage.clear();
    auth = TestBed.inject(AuthService);
  });

  afterEach(() => sessionStorage.clear());

  it('starts signed out', () => expect(auth.loggedIn()).toBeFalse());

  it('rejects a wrong username or password', () => {
    expect(auth.login(environment.mockUser.username, 'wrong')).toBeFalse();
    expect(auth.login('someone', environment.mockUser.password)).toBeFalse();
    expect(auth.loggedIn()).toBeFalse();
  });

  it('signs in with the mock user and signs out again', () => {
    expect(auth.login(` ${environment.mockUser.username} `, environment.mockUser.password)).toBeTrue();
    expect(auth.user()).toBe(environment.mockUser.name);
    auth.logout();
    expect(auth.loggedIn()).toBeFalse();
  });

  it('keeps the session for the tab, so a reload stays signed in', () => {
    auth.login(environment.mockUser.username, environment.mockUser.password);
    TestBed.resetTestingModule();
    expect(TestBed.inject(AuthService).loggedIn()).toBeTrue();
  });
});
