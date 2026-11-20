import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PushControl, PushStatus } from './push-control';

describe('PushControl', () => {
  let fixture: ComponentFixture<PushControl>;
  let element: HTMLElement;

  function render(status: PushStatus, extra: { isBusy?: boolean; error?: string | null } = {}) {
    fixture = TestBed.createComponent(PushControl);
    fixture.componentRef.setInput('status', status);
    fixture.componentRef.setInput('isBusy', extra.isBusy ?? false);
    fixture.componentRef.setInput('error', extra.error ?? null);
    fixture.detectChanges();
    element = fixture.nativeElement;
  }

  it('always has the Notificações heading', () => {
    render('off');
    expect(element.querySelector('h2')?.textContent).toContain('Notificações');
  });

  it('explains the install step on needs-install', () => {
    render('needs-install');
    expect(element.textContent).toContain('Adicionar ao ecrã principal');
    expect(element.querySelector('button')).toBeNull();
  });

  it('explains that notifications are blocked in the browser settings', () => {
    render('blocked');
    expect(element.textContent).toContain('bloqueadas');
    expect(element.textContent).toContain('definições do navegador');
    expect(element.querySelector('button')).toBeNull();
  });

  it('explains that the browser has no support', () => {
    render('unsupported');
    expect(element.textContent).toContain('não suporta notificações');
    expect(element.querySelector('button')).toBeNull();
  });

  it('emits enable from the off state', () => {
    render('off');
    const enable = vi.fn();
    fixture.componentInstance.enable.subscribe(enable);

    element.querySelector('button')!.click();

    expect(element.querySelector('button')!.textContent).toContain('Ativar notificações');
    expect(enable).toHaveBeenCalledTimes(1);
  });

  it('emits disable from the on state', () => {
    render('on');
    const disable = vi.fn();
    fixture.componentInstance.disable.subscribe(disable);

    element.querySelector('button')!.click();

    expect(element.querySelector('button')!.textContent).toContain('Desativar notificações');
    expect(disable).toHaveBeenCalledTimes(1);
  });

  it('disables the button while busy', () => {
    render('off', { isBusy: true });
    expect(element.querySelector('button')!.disabled).toBe(true);
  });

  it('shows the error text', () => {
    render('off', { error: 'Correu mal' });
    expect(element.querySelector('[role="alert"]')?.textContent).toContain('Correu mal');
  });
});
