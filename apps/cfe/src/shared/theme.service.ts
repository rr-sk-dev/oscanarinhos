import { DOCUMENT } from '@angular/common';
import { computed, effect, inject, Service, signal } from '@angular/core';

export type Theme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'canarinhos-theme';

const THEME_COLORS: Record<Theme, string> = { light: '#f4f3ee', dark: '#0c0c0b' };

/** The app's theme: dark unless the user switched to light, which is stored. */
@Service()
export class ThemeService {
  private readonly document = inject(DOCUMENT);

  private readonly themeState = signal<Theme>(this.readStoredTheme());
  /** Changes only through `toggle()`, which also stores it. */
  readonly theme = this.themeState.asReadonly();
  readonly isDark = computed(() => this.theme() === 'dark');

  constructor() {
    effect(() => this.apply(this.theme()));
  }

  toggle(): void {
    const theme: Theme = this.isDark() ? 'light' : 'dark';
    this.themeState.set(theme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Storage can be unavailable (private mode); the choice then lasts for this session only.
    }
  }

  private apply(theme: Theme): void {
    this.document.documentElement.setAttribute('data-theme', theme);
    this.document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', THEME_COLORS[theme]);
  }

  private readStoredTheme(): Theme {
    try {
      if (localStorage.getItem(THEME_STORAGE_KEY) === 'light') {
        return 'light';
      }
    } catch {
      // Fall through to the default.
    }
    return 'dark';
  }
}
