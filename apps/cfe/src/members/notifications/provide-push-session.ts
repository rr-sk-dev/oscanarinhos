import { EnvironmentProviders, inject, provideAppInitializer } from '@angular/core';
import { PushService } from './push.service';

/**
 * Creates PushService at startup, so its sign-out hook and its re-registration on sign-in are
 * active on every page, not only after the calendar page has been opened.
 */
export function providePushSession(): EnvironmentProviders {
  return provideAppInitializer(() => {
    inject(PushService);
  });
}
