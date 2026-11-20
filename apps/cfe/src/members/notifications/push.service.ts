import { HttpClient } from '@angular/common/http';
import { computed, effect, inject, Service, signal, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { SwPush } from '@angular/service-worker';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from '../auth/auth.service';
import { needsInstall } from './push-support';

export type PushStatus = 'unsupported' | 'needs-install' | 'blocked' | 'off' | 'on';

const ENABLE_ERROR = 'Não foi possível ativar as notificações. Tenta novamente.';
const DISABLE_ERROR = 'Não foi possível desativar as notificações. Tenta novamente.';

interface Registration {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

/** The body the API stores for a device, or null when the browser gave no keys. */
function toRegistration(subscription: PushSubscription): Registration | null {
  const keys = subscription.toJSON().keys;
  if (!keys?.['p256dh'] || !keys['auth']) {
    return null;
  }
  return { endpoint: subscription.endpoint, keys: { p256dh: keys['p256dh'], auth: keys['auth'] } };
}

function readPermission(): NotificationPermission | 'unavailable' {
  return typeof Notification === 'undefined' ? 'unavailable' : Notification.permission;
}

function isStandalone(): boolean {
  const { standalone } = navigator as Navigator & { standalone?: boolean };
  return standalone === true || window.matchMedia?.('(display-mode: standalone)').matches === true;
}

/** Web push for this device: browser subscription plus its registration with the API. */
@Service()
export class PushService {
  private readonly http = inject(HttpClient);
  private readonly swPush = inject(SwPush);
  private readonly auth = inject(AuthService);
  private readonly url = `${environment.apiUrl}/api/me/push-subscriptions`;

  private readonly subscription = toSignal(this.swPush.subscription, { initialValue: null });
  private readonly permission = signal(readPermission());
  private readonly needsInstall = needsInstall({
    userAgent: navigator.userAgent,
    maxTouchPoints: navigator.maxTouchPoints,
    isStandalone: isStandalone(),
  });
  private readonly busy = signal(false);
  private readonly failure = signal<string | null>(null);

  readonly isBusy = this.busy.asReadonly();
  readonly error = this.failure.asReadonly();
  readonly status = computed<PushStatus>(() => {
    if (this.needsInstall) {
      return 'needs-install';
    }
    if (!this.swPush.isEnabled) {
      return 'unsupported';
    }
    if (this.permission() === 'denied') {
      return 'blocked';
    }
    return this.subscription() ? 'on' : 'off';
  });

  constructor() {
    // A browser subscription belongs to whoever signed in on it: move an existing one to the
    // account of each new session (the POST is an upsert). Sessions only end on a 401, when
    // the API can no longer be called, so there is nothing to release on sign-out.
    effect(() => {
      if (this.auth.getToken()) {
        untracked(() => void this.registerExistingSubscription());
      }
    });
  }

  async enable(): Promise<void> {
    if (this.busy()) {
      return;
    }
    this.busy.set(true);
    this.failure.set(null);
    try {
      await this.subscribe();
    } finally {
      this.permission.set(readPermission());
      this.busy.set(false);
    }
  }

  async disable(): Promise<void> {
    const endpoint = this.subscription()?.endpoint;
    if (this.busy() || !endpoint) {
      return;
    }
    this.busy.set(true);
    this.failure.set(null);
    try {
      // Server first: if it fails, the browser subscription stays and the user can retry. The
      // DELETE is idempotent, so a retry after a failed unsubscribe is safe too.
      await firstValueFrom(this.http.delete<void>(this.url, { body: { endpoint } }));
      await this.swPush.unsubscribe();
    } catch {
      this.failure.set(DISABLE_ERROR);
    } finally {
      this.busy.set(false);
    }
  }

  private async registerExistingSubscription(): Promise<void> {
    if (!this.swPush.isEnabled) {
      return;
    }
    const existing = await firstValueFrom(this.swPush.subscription);
    const registration = existing ? toRegistration(existing) : null;
    if (!registration) {
      return;
    }
    try {
      await firstValueFrom(this.http.post<void>(this.url, registration));
    } catch {
      // Best effort: the device keeps its previous registration.
    }
  }

  private async subscribe(): Promise<void> {
    let created: PushSubscription;
    try {
      created = await this.swPush.requestSubscription({
        serverPublicKey: environment.vapidPublicKey,
      });
    } catch {
      // A refused permission prompt shows as 'blocked'; anything else is worth an error message.
      if (readPermission() !== 'denied') {
        this.failure.set(ENABLE_ERROR);
      }
      return;
    }

    try {
      const registration = toRegistration(created);
      if (!registration) {
        throw new Error('The browser subscription has no keys');
      }
      await firstValueFrom(this.http.post<void>(this.url, registration));
    } catch {
      // Nothing half-registered: drop the browser subscription the API never heard of.
      await this.swPush.unsubscribe().catch(() => undefined);
      this.failure.set(ENABLE_ERROR);
    }
  }
}
