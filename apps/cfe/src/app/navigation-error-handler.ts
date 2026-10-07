import { DOCUMENT } from '@angular/common';
import { inject } from '@angular/core';
import { NavigationError } from '@angular/router';

// Browsers word this differently: Chrome "Failed to fetch dynamically imported module",
// Firefox "error loading dynamically imported module", Safari "Importing a module script failed".
const CHUNK_LOAD_ERROR = /dynamically imported module|Importing a module script failed/i;
const RELOADED_URL_KEY = 'canarinhos-chunk-reload';

/**
 * After a deploy, an open tab can ask for a lazy chunk that no longer exists.
 * Reload the target URL once so the user gets the new build instead of a dead click.
 * A second failure for the same URL (e.g. offline) is only logged, to avoid a reload loop.
 * Runs in an injection context (see `withNavigationErrorHandler`).
 */
export function handleNavigationError(navigationError: NavigationError): void {
  const error = navigationError.error;
  const message = error instanceof Error ? error.message : String(error);

  if (CHUNK_LOAD_ERROR.test(message) && markReload(navigationError.url)) {
    inject(DOCUMENT).location.assign(navigationError.url);
    return;
  }

  console.error('Navigation failed', error);
}

/** Records a reload for `url`; false when this URL was already reloaded in this tab. */
function markReload(url: string): boolean {
  try {
    if (sessionStorage.getItem(RELOADED_URL_KEY) === url) {
      return false;
    }
    sessionStorage.setItem(RELOADED_URL_KEY, url);
    return true;
  } catch {
    // Without storage we cannot detect a loop, so do not reload.
    return false;
  }
}
