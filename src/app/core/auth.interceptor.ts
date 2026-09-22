import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../features/auth/services/auth.service';
import { showAppSnack } from '../shared/helpers/app-snackbar';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const snackBar = inject(MatSnackBar);
  const isAuthRequest = req.url.includes('/auth/login') || req.url.includes('/auth/register');

  let outgoing = req;
  if (!isAuthRequest) {
    const token = authService.getUser()?.token;
    if (token) {
      outgoing = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      });
    }
  }

  return next(outgoing).pipe(
    catchError((error: HttpErrorResponse) => {
      if (!isAuthRequest && error.status === 401 && authService.getUser()) {
        authService.logout();
        showAppSnack(snackBar, 'Your session expired. Please log in again.', 'error');
        void router.navigate(['/login']);
      }

      if (error.status === 403) {
        showAppSnack(snackBar, 'You do not have permission to do that.', 'error');
      }

      return throwError(() => error);
    }),
  );
};
