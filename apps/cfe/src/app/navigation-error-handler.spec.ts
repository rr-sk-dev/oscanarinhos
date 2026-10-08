import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { NavigationError } from '@angular/router';
import { handleNavigationError } from './navigation-error-handler';

describe('handleNavigationError', () => {
  const assign = vi.fn();

  function handle(error: unknown, url = '/squad'): void {
    TestBed.runInInjectionContext(() => handleNavigationError(new NavigationError(1, url, error)));
  }

  beforeEach(() => {
    assign.mockClear();
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [{ provide: DOCUMENT, useValue: { location: { assign } } }],
    });
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it('reloads the target URL once when a lazy chunk fails to load', () => {
    const chunkError = new TypeError('Failed to fetch dynamically imported module: /chunk-X.js');

    handle(chunkError);
    expect(assign).toHaveBeenCalledTimes(1);
    expect(assign).toHaveBeenCalledWith('/squad');

    // A second failure for the same URL (e.g. offline) must not loop.
    handle(chunkError);
    expect(assign).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalled();
  });

  it('logs other navigation errors instead of swallowing them', () => {
    handle(new Error('boom'));

    expect(assign).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalled();
  });
});
