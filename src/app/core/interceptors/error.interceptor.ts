import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../services/toast.service';

/** Turns any failed API call into a readable toast; callers still receive the error to roll back their state. */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      toast.show(friendlyMessage(error), 'error');
      return throwError(() => error);
    })
  );
};

function friendlyMessage(error: HttpErrorResponse): string {
  if (error.status === 0) return "Can't reach the API. Start it with `npm run mock:server` and try again.";
  if (error.status === 404) return 'That item no longer exists. Refresh the page.';
  return 'Something went wrong. Please try again.';
}
