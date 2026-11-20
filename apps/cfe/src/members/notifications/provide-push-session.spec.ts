import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SwPush } from '@angular/service-worker';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from '../auth/auth.service';
import { providePushSession } from './provide-push-session';

describe('providePushSession', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it('releases the device on sign-out even when no page has used push yet', async () => {
    localStorage.setItem('canarinhos.accessToken', 'tok');
    const unsubscribe = vi.fn(async () => undefined);
    TestBed.configureTestingModule({
      providers: [
        providePushSession(),
        {
          provide: SwPush,
          useValue: {
            isEnabled: true,
            subscription: new BehaviorSubject({
              endpoint: 'https://push.example/abc',
              toJSON: () => ({ keys: { p256dh: 'P', auth: 'A' } }),
            }),
            unsubscribe,
          },
        },
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    await TestBed.inject(ApplicationInitStatus).donePromise;
    const http = TestBed.inject(HttpTestingController);
    const url = `${environment.apiUrl}/api/me/push-subscriptions`;

    const done = TestBed.inject(AuthService).signOut();
    const request = await vi.waitFor(() =>
      http.expectOne((req) => req.url === url && req.method === 'DELETE'),
    );
    request.flush(null, { status: 204, statusText: 'No Content' });
    await done;

    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });
});
