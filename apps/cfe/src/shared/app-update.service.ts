import { DOCUMENT } from '@angular/common';
import { DestroyRef, inject, Service, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SwUpdate } from '@angular/service-worker';

/**
 * Tracks new app versions from the service worker. Without it, an open PWA keeps running the old
 * build until every tab is closed.
 */
@Service()
export class AppUpdateService {
  private readonly swUpdate = inject(SwUpdate);
  private readonly document = inject(DOCUMENT);

  private readonly ready = signal(false);
  /** A new version has been downloaded; reloading switches to it. */
  readonly updateReady = this.ready.asReadonly();

  constructor() {
    if (!this.swUpdate.isEnabled) {
      return;
    }
    const destroyRef = inject(DestroyRef);

    this.swUpdate.versionUpdates.pipe(takeUntilDestroyed(destroyRef)).subscribe((event) => {
      if (event.type === 'VERSION_READY') {
        this.ready.set(true);
      }
    });
    // The cached app is broken (e.g. files evicted): only a reload can recover.
    this.swUpdate.unrecoverable
      .pipe(takeUntilDestroyed(destroyRef))
      .subscribe(() => this.document.location.reload());

    // The service worker only checks on navigation requests; a long-open PWA also needs a check
    // when it comes back to the foreground.
    const onVisibilityChange = () => {
      if (this.document.visibilityState === 'visible') {
        this.swUpdate.checkForUpdate().catch(() => {
          // Offline or the check failed: the next resume tries again.
        });
      }
    };
    this.document.addEventListener('visibilitychange', onVisibilityChange);
    destroyRef.onDestroy(() =>
      this.document.removeEventListener('visibilitychange', onVisibilityChange),
    );
  }

  /** Reloads the page, which serves the new version. */
  applyUpdate(): void {
    this.document.location.reload();
  }
}
