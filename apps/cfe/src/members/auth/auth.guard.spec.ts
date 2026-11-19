import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  provideRouter,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import { authGuard } from './auth.guard';
import { AuthService } from './auth.service';

describe('authGuard', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
  });

  afterEach(() => localStorage.clear());

  function run() {
    return TestBed.runInInjectionContext(() =>
      authGuard(
        {} as ActivatedRouteSnapshot,
        { url: '/members/availability' } as RouterStateSnapshot,
      ),
    );
  }

  it('redirects to sign-in with the target url when signed out', () => {
    const result = run();

    expect(TestBed.inject(Router).serializeUrl(result as never)).toBe(
      '/members/sign-in?next=%2Fmembers%2Favailability',
    );
  });

  it('lets a signed-in member through', () => {
    TestBed.inject(AuthService).storeToken('abc');

    expect(run()).toBe(true);
  });
});
