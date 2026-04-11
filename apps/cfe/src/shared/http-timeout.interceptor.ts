import { HttpInterceptorFn } from '@angular/common/http';
import { timeout } from 'rxjs';

export const httpTimeoutInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(timeout(10_000));
};
