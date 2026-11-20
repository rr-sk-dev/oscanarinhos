import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SwPush } from '@angular/service-worker';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';
import { providePushSession } from './provide-push-session';

describe('providePushSession', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it('re-registers the device for a stored session even when no page has used push yet', async () => {
    localStorage.setItem('canarinhos.accessToken', 'tok');
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
            unsubscribe: vi.fn(),
          },
        },
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    await TestBed.inject(ApplicationInitStatus).donePromise;
    TestBed.tick();
    const http = TestBed.inject(HttpTestingController);
    const url = `${environment.apiUrl}/api/me/push-subscriptions`;

    const request = await vi.waitFor(() =>
      http.expectOne((req) => req.url === url && req.method === 'POST'),
    );
    request.flush(null, { status: 204, statusText: 'No Content' });
  });
});
