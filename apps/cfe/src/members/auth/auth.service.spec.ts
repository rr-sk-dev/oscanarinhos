import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { SignOutHooks } from './sign-out-hooks';

describe('AuthService', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('stores the token returned by verify', async () => {
    const auth = TestBed.inject(AuthService);
    const http = TestBed.inject(HttpTestingController);

    const done = auth.verify('a@b.pt', '123456');
    const request = http.expectOne(`${environment.apiUrl}/api/auth/verify`);
    expect(request.request.body).toEqual({ email: 'a@b.pt', code: '123456' });
    request.flush({ accessToken: 'tok' });
    await done;

    expect(auth.isSignedIn()).toBe(true);
    expect(localStorage.getItem('canarinhos.accessToken')).toBe('tok');
  });

  it('starts signed in when a token is stored', () => {
    localStorage.setItem('canarinhos.accessToken', 'tok');

    expect(TestBed.inject(AuthService).isSignedIn()).toBe(true);
  });

  it('works signed out when storage throws', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('denied');
    });
    const auth = TestBed.inject(AuthService);
    expect(auth.isSignedIn()).toBe(false);

    const done = auth.verify('a@b.pt', '123456');
    TestBed.inject(HttpTestingController)
      .expectOne(`${environment.apiUrl}/api/auth/verify`)
      .flush({ accessToken: 'tok' });
    await done;

    expect(auth.isSignedIn()).toBe(true);
    await auth.signOut();
    expect(auth.isSignedIn()).toBe(false);
  });

  it('picks the membership of the current team, else the first', async () => {
    localStorage.setItem('canarinhos.accessToken', 'tok');
    const auth = TestBed.inject(AuthService);
    const http = TestBed.inject(HttpTestingController);
    TestBed.tick();

    http.expectOne((req) => req.url.endsWith('/details')).flush({ id: 't2' });
    http.expectOne(`${environment.apiUrl}/api/me`).flush({
      user: { id: 'u', email: 'a@b.pt', name: null },
      memberships: [
        { teamId: 't1', teamName: 'A', role: 'PLAYER', membershipId: 'm1' },
        { teamId: 't2', teamName: 'B', role: 'COACH', membershipId: 'm2' },
      ],
    });
    await TestBed.inject(ApplicationRef).whenStable();

    expect(auth.activeMembership()?.membershipId).toBe('m2');
  });

  describe('signOut', () => {
    it('runs the sign-out hooks while the token is still set, then clears it', async () => {
      localStorage.setItem('canarinhos.accessToken', 'tok');
      const auth = TestBed.inject(AuthService);
      const tokenSeenByHook: (string | null)[] = [];
      TestBed.inject(SignOutHooks).add(async () => {
        tokenSeenByHook.push(auth.getToken());
      });

      await auth.signOut();

      expect(tokenSeenByHook).toEqual(['tok']);
      expect(auth.isSignedIn()).toBe(false);
      expect(localStorage.getItem('canarinhos.accessToken')).toBeNull();
    });

    it('still signs out when a hook fails', async () => {
      localStorage.setItem('canarinhos.accessToken', 'tok');
      const auth = TestBed.inject(AuthService);
      const later = vi.fn(async () => undefined);
      const hooks = TestBed.inject(SignOutHooks);
      hooks.add(() => Promise.reject(new Error('offline')));
      hooks.add(() => {
        throw new Error('sync');
      });
      hooks.add(later);

      await expect(auth.signOut()).resolves.toBeUndefined();

      expect(later).toHaveBeenCalledTimes(1);
      expect(auth.isSignedIn()).toBe(false);
    });

    it('runs the hooks once when sign-out is requested again while in progress', async () => {
      localStorage.setItem('canarinhos.accessToken', 'tok');
      const auth = TestBed.inject(AuthService);
      let finish: () => void = () => undefined;
      const hook = vi.fn(() => new Promise<void>((resolve) => (finish = resolve)));
      TestBed.inject(SignOutHooks).add(hook);

      const first = auth.signOut();
      await vi.waitFor(() => expect(hook).toHaveBeenCalled());
      const second = auth.signOut();
      finish();
      await Promise.all([first, second]);

      expect(hook).toHaveBeenCalledTimes(1);
      expect(auth.isSignedIn()).toBe(false);
    });

    it('runs no hooks when already signed out', async () => {
      const auth = TestBed.inject(AuthService);
      const hook = vi.fn(async () => undefined);
      TestBed.inject(SignOutHooks).add(hook);

      await auth.signOut();

      expect(hook).not.toHaveBeenCalled();
    });
  });
});
