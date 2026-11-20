import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { SwPush } from '@angular/service-worker';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';
import { authInterceptor } from '../auth/auth.interceptor';
import { AuthService } from '../auth/auth.service';
import { PushService } from './push.service';

const IPHONE =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1';
const URL = `${environment.apiUrl}/api/me/push-subscriptions`;

function aSubscription(keys: Record<string, string> | null = { p256dh: 'P', auth: 'A' }) {
  return {
    endpoint: 'https://push.example/abc',
    toJSON: () => ({ endpoint: 'x', ...(keys ? { keys } : {}) }),
  };
}

describe('PushService', () => {
  let subscription: BehaviorSubject<ReturnType<typeof aSubscription> | null>;
  let swPush: {
    isEnabled: boolean;
    subscription: BehaviorSubject<ReturnType<typeof aSubscription> | null>;
    requestSubscription: ReturnType<typeof vi.fn>;
    unsubscribe: ReturnType<typeof vi.fn>;
  };
  let http: HttpTestingController;

  function setup(options: { isEnabled?: boolean; permission?: string; userAgent?: string } = {}) {
    vi.stubGlobal('Notification', { permission: options.permission ?? 'default' });
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(options.userAgent ?? 'Chrome');
    subscription = new BehaviorSubject<ReturnType<typeof aSubscription> | null>(null);
    swPush = {
      isEnabled: options.isEnabled ?? true,
      subscription,
      requestSubscription: vi.fn(async () => {
        const created = aSubscription();
        subscription.next(created);
        return created;
      }),
      unsubscribe: vi.fn(async () => subscription.next(null)),
    };
    TestBed.configureTestingModule({
      providers: [
        { provide: SwPush, useValue: swPush },
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpTestingController);
    vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    return TestBed.inject(PushService);
  }

  beforeEach(() => localStorage.clear());

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  describe('status', () => {
    it('is unsupported when the service worker is disabled', () => {
      expect(setup({ isEnabled: false }).status()).toBe('unsupported');
    });

    it('needs an install on iOS outside standalone mode', () => {
      vi.stubGlobal('matchMedia', () => ({ matches: false }));
      expect(setup({ isEnabled: false, userAgent: IPHONE }).status()).toBe('needs-install');
    });

    it('is blocked when the permission was denied', () => {
      expect(setup({ permission: 'denied' }).status()).toBe('blocked');
    });

    it('is off without a subscription', () => {
      expect(setup().status()).toBe('off');
    });

    it('is on when a subscription exists', () => {
      const service = setup();
      subscription.next(aSubscription());
      TestBed.tick();
      expect(service.status()).toBe('on');
    });
  });

  async function nextRequest(method: string) {
    return vi.waitFor(() => http.expectOne((req) => req.url === URL && req.method === method));
  }

  describe('enable', () => {
    it('subscribes with the VAPID key and posts the endpoint and keys', async () => {
      const service = setup();

      const done = service.enable();
      const request = await nextRequest('POST');
      expect(swPush.requestSubscription).toHaveBeenCalledWith({
        serverPublicKey: environment.vapidPublicKey,
      });
      expect(request.request.body).toEqual({
        endpoint: 'https://push.example/abc',
        keys: { p256dh: 'P', auth: 'A' },
      });
      request.flush(null, { status: 204, statusText: 'No Content' });
      await done;

      expect(service.status()).toBe('on');
      expect(service.error()).toBeNull();
      expect(service.isBusy()).toBe(false);
    });

    it('stays off, unsubscribes and reports an error when the POST fails', async () => {
      const service = setup();

      const done = service.enable();
      (await nextRequest('POST')).flush({}, { status: 500, statusText: 'Server Error' });
      await done;

      expect(swPush.unsubscribe).toHaveBeenCalled();
      expect(service.status()).toBe('off');
      expect(service.error()).toBe('Não foi possível ativar as notificações. Tenta novamente.');
      expect(service.isBusy()).toBe(false);
    });

    it('unsubscribes and reports an error when the browser gives no keys', async () => {
      const service = setup();
      swPush.requestSubscription.mockResolvedValue(aSubscription(null));

      await service.enable();

      http.expectNone(URL);
      expect(swPush.unsubscribe).toHaveBeenCalled();
      expect(service.error()).not.toBeNull();
    });

    it('reports blocked when the user refuses the permission prompt', async () => {
      const service = setup();
      swPush.requestSubscription.mockImplementation(async () => {
        (Notification as { permission: string }).permission = 'denied';
        throw new Error('denied');
      });

      await service.enable();

      http.expectNone(URL);
      expect(service.status()).toBe('blocked');
    });
  });

  describe('disable', () => {
    function subscribed() {
      const service = setup();
      subscription.next(aSubscription());
      TestBed.tick();
      return service;
    }

    it('deletes the endpoint, then unsubscribes the browser', async () => {
      const service = subscribed();

      const done = service.disable();
      const request = await nextRequest('DELETE');
      expect(request.request.body).toEqual({ endpoint: 'https://push.example/abc' });
      expect(swPush.unsubscribe).not.toHaveBeenCalled();
      request.flush(null, { status: 204, statusText: 'No Content' });
      await done;

      expect(swPush.unsubscribe).toHaveBeenCalledTimes(1);
      expect(service.status()).toBe('off');
      expect(service.error()).toBeNull();
    });

    it('keeps the subscription and allows a retry when the DELETE fails', async () => {
      const service = subscribed();

      const first = service.disable();
      const request = await nextRequest('DELETE');
      expect(request.request.body).toEqual({ endpoint: 'https://push.example/abc' });
      request.flush({}, { status: 500, statusText: 'Server Error' });
      await first;

      expect(swPush.unsubscribe).not.toHaveBeenCalled();
      expect(service.status()).toBe('on');
      expect(service.error()).toBe('Não foi possível desativar as notificações. Tenta novamente.');
      expect(service.isBusy()).toBe(false);

      const second = service.disable();
      const retry = await nextRequest('DELETE');
      retry.flush(null, { status: 204, statusText: 'No Content' });
      await second;
      expect(service.status()).toBe('off');
    });

    it('stays on with an error when the browser unsubscribe fails after the DELETE', async () => {
      const service = subscribed();
      swPush.unsubscribe.mockRejectedValue(new Error('nope'));

      const done = service.disable();
      (await nextRequest('DELETE')).flush(null, { status: 204, statusText: 'No Content' });
      await done;

      expect(service.status()).toBe('on');
      expect(service.error()).toBe('Não foi possível desativar as notificações. Tenta novamente.');
      expect(service.isBusy()).toBe(false);
    });

    it('does nothing without a subscription', async () => {
      const service = setup();

      await service.disable();

      expect(swPush.unsubscribe).not.toHaveBeenCalled();
      http.expectNone(URL);
    });
  });

  describe('sign-out', () => {
    it('keeps the browser subscription and sends nothing', async () => {
      setup();
      const auth = TestBed.inject(AuthService);
      subscription.next(aSubscription());
      TestBed.tick();
      auth.storeToken('tok');
      TestBed.tick();
      (await nextRequest('POST')).flush(null, { status: 204, statusText: 'No Content' });

      await auth.signOut();

      http.expectNone((req) => req.url === URL && req.method === 'DELETE');
      expect(swPush.unsubscribe).not.toHaveBeenCalled();
      expect(auth.isSignedIn()).toBe(false);
    });
  });

  describe('sign-in', () => {
    it('re-registers an existing browser subscription once for the new session', async () => {
      setup();
      const auth = TestBed.inject(AuthService);
      subscription.next(aSubscription());
      TestBed.tick();
      http.expectNone(URL);

      auth.storeToken('tok');
      TestBed.tick();
      const request = await nextRequest('POST');
      expect(request.request.body).toEqual({
        endpoint: 'https://push.example/abc',
        keys: { p256dh: 'P', auth: 'A' },
      });
      expect(request.request.headers.get('Authorization')).toBe('Bearer tok');
      request.flush(null, { status: 204, statusText: 'No Content' });
      TestBed.tick();
      await new Promise((resolve) => setTimeout(resolve));

      http.expectNone(URL);
    });

    it('re-registers again when another user signs in on the same browser', async () => {
      setup();
      const auth = TestBed.inject(AuthService);
      subscription.next(aSubscription());
      auth.storeToken('token-a');
      TestBed.tick();
      (await nextRequest('POST')).flush(null, { status: 204, statusText: 'No Content' });

      auth.storeToken('token-b');
      TestBed.tick();
      const request = await nextRequest('POST');

      expect(request.request.headers.get('Authorization')).toBe('Bearer token-b');
    });

    it('registers nothing on sign-in without a browser subscription', async () => {
      setup();
      const auth = TestBed.inject(AuthService);

      auth.storeToken('tok');
      TestBed.tick();
      await new Promise((resolve) => setTimeout(resolve));

      http.expectNone(URL);
    });

    it('registers nothing when the service worker is disabled', async () => {
      setup({ isEnabled: false });
      const auth = TestBed.inject(AuthService);

      auth.storeToken('tok');
      TestBed.tick();
      await new Promise((resolve) => setTimeout(resolve));

      http.expectNone(URL);
    });
  });
});
