import { DOCUMENT } from '@angular/common';
import { DestroyRef, effect, inject, Signal } from '@angular/core';

/** Anything with a `reload()`, such as an `httpResource`. */
export interface Reloadable {
  reload(): unknown;
}

/** How long the app must be in the background before its data counts as stale. */
export const STALE_AFTER_MS = 5 * 60 * 1000;

/**
 * Reloads `resources` when the app comes back after being hidden for `STALE_AFTER_MS`, and when
 * the device comes back online. The PWA can stay open for days, and root services otherwise load
 * their data only once. Call it in an injection context.
 */
export function reloadOnResume(...resources: Reloadable[]): void {
  const document = inject(DOCUMENT);
  const window = document.defaultView;
  let hiddenAt: number | null = null;

  const reloadAll = () => resources.forEach((resource) => resource.reload());
  const onVisibilityChange = () => {
    if (document.visibilityState === 'hidden') {
      hiddenAt = Date.now();
      return;
    }
    if (hiddenAt !== null && Date.now() - hiddenAt >= STALE_AFTER_MS) {
      reloadAll();
    }
    hiddenAt = null;
  };

  document.addEventListener('visibilitychange', onVisibilityChange);
  window?.addEventListener('online', reloadAll);
  inject(DestroyRef).onDestroy(() => {
    document.removeEventListener('visibilitychange', onVisibilityChange);
    window?.removeEventListener('online', reloadAll);
  });
}

/**
 * Calls `reload` every `periodMs` while `active` is true, e.g. to keep a live score current.
 * Call it in an injection context.
 */
export function reloadWhile(active: Signal<boolean>, periodMs: number, reload: () => void): void {
  effect((onCleanup) => {
    if (!active()) {
      return;
    }
    const timer = setInterval(reload, periodMs);
    onCleanup(() => clearInterval(timer));
  });
}
