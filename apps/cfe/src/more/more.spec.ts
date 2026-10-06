import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { THEME_STORAGE_KEY, ThemeService } from '../shared/theme.service';
import { More } from './more';

describe('More', () => {
  let component: More;
  let fixture: ComponentFixture<More>;
  let theme: ThemeService;

  beforeEach(async () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'light');
    await TestBed.configureTestingModule({
      imports: [More],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(More);
    component = fixture.componentInstance;
    theme = TestBed.inject(ThemeService);
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.removeItem(THEME_STORAGE_KEY);
    document.documentElement.removeAttribute('data-theme');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('links the live entry to /live', () => {
    const live: HTMLAnchorElement = fixture.nativeElement.querySelector('a.accent-card');
    expect(live.getAttribute('href')).toBe('/live');
  });

  it('toggles dark mode through the switch', () => {
    const toggle: HTMLButtonElement = fixture.nativeElement.querySelector('[role="switch"]');
    expect(toggle.getAttribute('aria-checked')).toBe('false');
    expect(toggle.textContent).toContain('Desativado');

    toggle.click();
    fixture.detectChanges();

    expect(theme.isDark()).toBeTrue();
    expect(toggle.getAttribute('aria-checked')).toBe('true');
    expect(toggle.textContent).toContain('Ativado');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });
});
