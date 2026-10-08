import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StorePreview } from './store-preview';

describe('StorePreview', () => {
  let fixture: ComponentFixture<StorePreview>;
  let element: HTMLElement;

  beforeEach(async () => {
    fixture = TestBed.createComponent(StorePreview);
    element = fixture.nativeElement;
    await fixture.whenStable();
  });

  it('renders the items only once the modal is opened, with euro prices', async () => {
    expect(element.querySelector('dialog')!.textContent).not.toContain('Camisola Principal');

    element.querySelector<HTMLButtonElement>('section button')!.click();
    await fixture.whenStable();

    const dialog = element.querySelector('dialog')!;
    expect(dialog.open).toBe(true);
    expect(dialog.textContent).toContain('Camisola Principal');
    expect(dialog.textContent).toContain('35 €');
  });
});
