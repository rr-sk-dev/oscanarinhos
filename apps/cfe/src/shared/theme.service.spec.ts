import { TestBed } from '@angular/core/testing';
import { THEME_STORAGE_KEY, ThemeService } from './theme.service';

describe('ThemeService', () => {
  const root = document.documentElement;

  beforeEach(() => {
    localStorage.removeItem(THEME_STORAGE_KEY);
    root.removeAttribute('data-theme');
  });

  afterEach(() => {
    localStorage.removeItem(THEME_STORAGE_KEY);
    root.removeAttribute('data-theme');
  });

  function createService(): ThemeService {
    const service = TestBed.inject(ThemeService);
    TestBed.tick();
    return service;
  }

  it('follows the system preference when nothing is stored', () => {
    const service = createService();

    expect(service.preference()).toBe('system');
    expect(root.hasAttribute('data-theme')).toBe(false);
  });

  it('applies a stored preference', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark');

    const service = createService();

    expect(service.isDark()).toBe(true);
    expect(root.getAttribute('data-theme')).toBe('dark');
  });

  it('toggles to the opposite theme and stores it', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'light');
    const service = createService();

    service.toggle();
    TestBed.tick();

    expect(service.isDark()).toBe(true);
    expect(root.getAttribute('data-theme')).toBe('dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
  });
});
