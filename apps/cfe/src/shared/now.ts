import { DestroyRef, effect, inject, NgZone, Signal, signal } from '@angular/core';
import { LIVE_WINDOW_MS } from './match-status';

// The timers below run outside the Angular zone: a pending timer would otherwise keep the app
// "unstable" forever, delaying the service worker registration (registerWhenStable) and
// `whenStable()` in tests. Signal writes still schedule change detection on their own.

/**
 * A signal with the current time in ms, refreshed every `periodMs` until the caller is destroyed.
 * `Date.now()` is not reactive, so computeds that depend on time must read this instead.
 * Call it in an injection context.
 */
export function injectNow(periodMs: number): Signal<number> {
  const now = signal(Date.now());
  const timer = inject(NgZone).runOutsideAngular(() =>
    setInterval(() => now.set(Date.now()), periodMs),
  );
  inject(DestroyRef).onDestroy(() => clearInterval(timer));
  return now.asReadonly();
}

/**
 * Current time for a kickoff countdown: ticks every second until `kickoff`, every 30s while the
 * match may be live, then stops. Nothing ticks when there is no kickoff, so change detection does
 * not run every second for nothing. Call it in an injection context.
 */
export function injectKickoffClock(kickoff: Signal<number | null>): Signal<number> {
  const now = signal(Date.now());
  const zone = inject(NgZone);

  effect((onCleanup) => {
    const kickoffAt = kickoff();
    if (kickoffAt === null) {
      return;
    }

    let timer: ReturnType<typeof setTimeout> | undefined;
    const tick = () => {
      const current = Date.now();
      now.set(current);
      if (current < kickoffAt) {
        timer = setTimeout(tick, 1000);
      } else if (current <= kickoffAt + LIVE_WINDOW_MS) {
        timer = setTimeout(tick, 30_000);
      }
    };
    zone.runOutsideAngular(tick);
    onCleanup(() => clearTimeout(timer));
  });

  return now.asReadonly();
}
