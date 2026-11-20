import { EnvironmentProviders, inject, provideAppInitializer } from '@angular/core';
import { PushService } from './push.service';

/**
 * Creates PushService at startup, so its re-registration on sign-in is active on every page,
 * not only after the calendar page has been opened.
 */
export function providePushSession(): EnvironmentProviders {
  return provideAppInitializer(() => {
    inject(PushService);
  });
}
