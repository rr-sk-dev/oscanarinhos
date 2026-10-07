import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TeamCrest } from './team-crest';

describe('TeamCrest', () => {
  let fixture: ComponentFixture<TeamCrest>;

  beforeEach(() => {
    fixture = TestBed.createComponent(TeamCrest);
    fixture.componentRef.setInput('size', 64);
  });

  it('shows the logo as a decorative image filling its box', async () => {
    fixture.componentRef.setInput('logo', '/assets/seed/teams/aqa-logo.webp');
    await fixture.whenStable();

    const img: HTMLImageElement = fixture.nativeElement.querySelector('img');
    expect(img.getAttribute('src')).toBe('/assets/seed/teams/aqa-logo.webp');
    expect(img.getAttribute('alt')).toBe('');
  });

  it('shows a "?" tile when there is no logo', async () => {
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('img')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('?');
    expect(fixture.nativeElement.classList).toContain('bg-cui-tile-bg');
  });

  it('shows an empty square for small inline crests', async () => {
    fixture.componentRef.setInput('placeholder', 'blank');
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent.trim()).toBe('');
    expect(fixture.nativeElement.classList).toContain('bg-cui-surface-2');
  });
});
