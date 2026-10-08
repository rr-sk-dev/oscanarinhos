import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UpdateBanner } from './update-banner';

describe('UpdateBanner', () => {
  let fixture: ComponentFixture<UpdateBanner>;

  beforeEach(() => {
    fixture = TestBed.createComponent(UpdateBanner);
  });

  it('stays empty until an update is ready', async () => {
    fixture.componentRef.setInput('visible', false);
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent.trim()).toBe('');
  });

  it('offers the update inside a polite live region', async () => {
    let updates = 0;
    fixture.componentInstance.update.subscribe(() => updates++);
    fixture.componentRef.setInput('visible', true);
    await fixture.whenStable();

    const region: HTMLElement = fixture.nativeElement.querySelector('[aria-live="polite"]');
    expect(region.textContent).toContain('Nova versão disponível');
    region.querySelector('button')!.click();
    expect(updates).toBe(1);
  });
});
