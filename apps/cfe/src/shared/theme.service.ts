import { DOCUMENT } from '@angular/common';
import { computed, effect, inject, Injectable, signal } from '@angular/core';

export type ThemePreference = 'light' | 'dark' | 'system';

export const THEME_STORAGE_KEY = 'canarinhos-theme';

const THEME_COLORS = { light: '#f4f3ee', dark: '#121212' } as const;

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly darkQuery = this.document.defaultView?.matchMedia?.(
    '(prefers-color-scheme: dark)',
  );
  private readonly systemPrefersDark = signal(this.darkQuery?.matches ?? false);

  readonly preference = signal<ThemePreference>(this.readStoredPreference());
  readonly isDark = computed(() => {
    const preference = this.preference();
    if (preference === 'system') {
      return this.systemPrefersDark();
    }
    return preference === 'dark';
  });

  constructor() {
    this.darkQuery?.addEventListener('change', (event) =>
      this.systemPrefersDark.set(event.matches),
    );
    effect(() => this.apply(this.preference(), this.isDark()));
  }

  toggle(): void {
    this.setPreference(this.isDark() ? 'light' : 'dark');
  }

  setPreference(preference: ThemePreference): void {
    this.preference.set(preference);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, preference);
    } catch {
      // Storage can be unavailable (private mode); the choice then lasts for this session only.
    }
  }

  private apply(preference: ThemePreference, isDark: boolean): void {
    const root = this.document.documentElement;
    if (preference === 'system') {
      root.removeAttribute('data-theme');
    } else {
      root.setAttribute('data-theme', preference);
    }
    this.document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', isDark ? THEME_COLORS.dark : THEME_COLORS.light);
  }

  private readStoredPreference(): ThemePreference {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        return stored;
      }
    } catch {
      // Fall through to the default.
    }
    return 'system';
  }
}
