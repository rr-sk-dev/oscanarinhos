import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { reloadOnResume, reloadWhile, STALE_AFTER_MS } from './data-refresh';

describe('reloadOnResume', () => {
  let visibility: DocumentVisibilityState;
  const resource = { reload: vi.fn() };

  function setVisibility(state: DocumentVisibilityState): void {
    visibility = state;
    document.dispatchEvent(new Event('visibilitychange'));
  }

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    resource.reload.mockClear();
    visibility = 'visible';
    vi.spyOn(document, 'visibilityState', 'get').mockImplementation(() => visibility);
    TestBed.runInInjectionContext(() => reloadOnResume(resource));
  });

  afterEach(() => {
    TestBed.resetTestingModule(); // destroys the injector, removing the listeners
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('reloads when the app returns after being hidden long enough', () => {
    setVisibility('hidden');
    vi.advanceTimersByTime(STALE_AFTER_MS);
    setVisibility('visible');

    expect(resource.reload).toHaveBeenCalledTimes(1);
  });

  it('does not reload after a short switch away', () => {
    setVisibility('hidden');
    vi.advanceTimersByTime(STALE_AFTER_MS - 1);
    setVisibility('visible');

    expect(resource.reload).not.toHaveBeenCalled();
  });

  it('reloads when the device comes back online', () => {
    window.dispatchEvent(new Event('online'));

    expect(resource.reload).toHaveBeenCalledTimes(1);
  });
});

describe('reloadWhile', () => {
  beforeEach(() => vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] }));
  afterEach(() => vi.useRealTimers());

  it('polls only while active', async () => {
    const active = signal(false);
    const reload = vi.fn();
    TestBed.runInInjectionContext(() => reloadWhile(active, 1000, reload));

    TestBed.tick();
    vi.advanceTimersByTime(3000);
    expect(reload).not.toHaveBeenCalled();

    active.set(true);
    TestBed.tick();
    vi.advanceTimersByTime(3000);
    expect(reload).toHaveBeenCalledTimes(3);

    active.set(false);
    TestBed.tick();
    vi.advanceTimersByTime(3000);
    expect(reload).toHaveBeenCalledTimes(3);
  });
});
