import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

const SIGN_IN_URL = '/members/sign-in';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(environment.apiUrl)) {
    return next(req);
  }

  const auth = inject(AuthService);
  const router = inject(Router);
  const token = auth.getToken();
  const request = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(request).pipe(
    catchError((error: unknown) => {
      const isSignInCall = req.url.startsWith(`${environment.apiUrl}/api/auth/`);
      if (error instanceof HttpErrorResponse && error.status === 401 && !isSignInCall) {
        void auth.signOut();
        void router.navigateByUrl(SIGN_IN_URL);
      }
      return throwError(() => error);
    }),
  );
};
