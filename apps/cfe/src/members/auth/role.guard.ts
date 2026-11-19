import { toObservable } from '@angular/core/rxjs-interop';
import { computed, inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { filter, map, take } from 'rxjs';
import { AuthService } from './auth.service';

/** Lets only ADMIN and COACH through; everyone else goes back to the calendar. */
export const managerGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const isRoleKnown = computed(() => !auth.isMeLoading());
  return toObservable(isRoleKnown).pipe(
    filter(Boolean),
    take(1),
    map(() => {
      const role = auth.activeMembership()?.role;
      return role === 'ADMIN' || role === 'COACH' ? true : router.createUrlTree(['/members']);
    }),
  );
};
