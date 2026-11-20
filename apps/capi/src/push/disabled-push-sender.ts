import { PushResult, PushSender } from './push-sender';

/** Used when no VAPID keys are configured (development): nothing is ever delivered. */
export class DisabledPushSender extends PushSender {
  readonly isEnabled = false;

  send(): Promise<PushResult> {
    return Promise.resolve('failed');
  }
}
