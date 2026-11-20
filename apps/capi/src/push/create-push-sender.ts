import { ConfigService } from '@nestjs/config';
import * as webpush from 'web-push';
import { DisabledPushSender } from './disabled-push-sender';
import { PushSender } from './push-sender';
import { WebPushSender } from './web-push-sender';

/**
 * web-push only checks the VAPID keys and subject when it sends, so a mistyped production key
 * would silently turn every push into an email. Check them once at boot instead.
 */
function assertValidVapid(subject: string, publicKey: string, privateKey: string): void {
  try {
    webpush.setVapidDetails(subject, publicKey, privateKey);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Invalid VAPID configuration (VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY): ${reason}`,
    );
  }
}

/** Push is disabled (development) unless all three VAPID variables are set. */
export function createPushSender(configService: ConfigService): PushSender {
  const publicKey = configService.get<string>('VAPID_PUBLIC_KEY');
  const privateKey = configService.get<string>('VAPID_PRIVATE_KEY');
  const subject = configService.get<string>('VAPID_SUBJECT');
  if (!publicKey || !privateKey || !subject) {
    return new DisabledPushSender();
  }

  assertValidVapid(subject, publicKey, privateKey);
  return new WebPushSender(publicKey, privateKey, subject);
}
