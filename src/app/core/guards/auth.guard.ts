import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/** Sends signed-out visitors to the login page and brings them back to where they were going. */
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  return auth.loggedIn() || inject(Router).createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};
