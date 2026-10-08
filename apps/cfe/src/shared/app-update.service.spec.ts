import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { SwUpdate, UnrecoverableStateEvent, VersionEvent } from '@angular/service-worker';
import { Subject } from 'rxjs';
import { AppUpdateService } from './app-update.service';

describe('AppUpdateService', () => {
  const versionUpdates = new Subject<VersionEvent>();
  const unrecoverable = new Subject<UnrecoverableStateEvent>();
  const swUpdate = {
    isEnabled: true,
    versionUpdates,
    unrecoverable,
    checkForUpdate: vi.fn(() => Promise.resolve(false)),
  };
  const reload = vi.fn();
  // jsdom's location cannot be stubbed, so the service gets a minimal document instead.
  let fakeDocument: EventTarget & {
    visibilityState: DocumentVisibilityState;
    location: { reload: () => void };
  };

  function createService(): AppUpdateService {
    return TestBed.inject(AppUpdateService);
  }

  beforeEach(() => {
    reload.mockClear();
    swUpdate.checkForUpdate.mockClear();
    fakeDocument = Object.assign(new EventTarget(), {
      visibilityState: 'hidden' as DocumentVisibilityState,
      location: { reload },
    });
    TestBed.configureTestingModule({
      providers: [
        { provide: SwUpdate, useValue: swUpdate },
        { provide: DOCUMENT, useValue: fakeDocument },
      ],
    });
  });

  it('reports a downloaded version and reloads into it on request', () => {
    const service = createService();
    expect(service.updateReady()).toBe(false);

    versionUpdates.next({ type: 'VERSION_DETECTED', version: { hash: 'b' } });
    expect(service.updateReady()).toBe(false);

    versionUpdates.next({
      type: 'VERSION_READY',
      currentVersion: { hash: 'a' },
      latestVersion: { hash: 'b' },
    });
    expect(service.updateReady()).toBe(true);

    service.applyUpdate();
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('reloads when the cached app is unrecoverable', () => {
    createService();
    unrecoverable.next({ type: 'UNRECOVERABLE_STATE', reason: 'evicted' });

    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('checks for an update when the app returns to the foreground', () => {
    createService();
    fakeDocument.visibilityState = 'visible';
    fakeDocument.dispatchEvent(new Event('visibilitychange'));

    expect(swUpdate.checkForUpdate).toHaveBeenCalledTimes(1);
  });
});
