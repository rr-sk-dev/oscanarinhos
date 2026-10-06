import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Modal } from './modal';

describe('Modal', () => {
  let component: Modal;
  let fixture: ComponentFixture<Modal>;
  let dialog: HTMLDialogElement;
  let closedCount: number;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Modal],
    }).compileComponents();

    fixture = TestBed.createComponent(Modal);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('isOpen', false);
    fixture.componentRef.setInput('title', 'Loja');
    fixture.autoDetectChanges();
    closedCount = 0;
    component.closed.subscribe(() => closedCount++);
    await fixture.whenStable();
    dialog = fixture.nativeElement.querySelector('dialog');
  });

  afterEach(() => {
    if (dialog.open) {
      dialog.close();
    }
  });

  it('opens and closes the native dialog with isOpen', async () => {
    expect(dialog.open).toBeFalse();

    fixture.componentRef.setInput('isOpen', true);
    await fixture.whenStable();
    expect(dialog.open).toBeTrue();

    fixture.componentRef.setInput('isOpen', false);
    await fixture.whenStable();
    expect(dialog.open).toBeFalse();
    expect(closedCount).toBe(0);
  });

  it('labels the dialog with its title', () => {
    const titleId = dialog.getAttribute('aria-labelledby');
    expect(titleId).toBeTruthy();
    expect(fixture.nativeElement.querySelector(`#${titleId}`).textContent).toContain('Loja');
  });

  it('emits closed from the close button', async () => {
    fixture.componentRef.setInput('isOpen', true);
    await fixture.whenStable();

    fixture.nativeElement.querySelector('button[aria-label="Fechar"]').click();

    expect(closedCount).toBe(1);
  });

  it('emits closed when the dialog closes itself (Escape)', async () => {
    fixture.componentRef.setInput('isOpen', true);
    await fixture.whenStable();

    dialog.close();
    dialog.dispatchEvent(new Event('close'));

    expect(closedCount).toBeGreaterThan(0);
  });

  it('emits closed on a backdrop click but not on a content click', async () => {
    fixture.componentRef.setInput('isOpen', true);
    await fixture.whenStable();

    dialog.querySelector('h2')!.click();
    expect(closedCount).toBe(0);

    dialog.click();
    expect(closedCount).toBe(1);
  });
});
