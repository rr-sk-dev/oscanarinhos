import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ErrorState } from './error-state';

describe('ErrorState', () => {
  let fixture: ComponentFixture<ErrorState>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ErrorState);
    fixture.componentRef.setInput('message', 'Falha ao carregar');
  });

  it('announces the message and emits retry', async () => {
    let retries = 0;
    fixture.componentInstance.retry.subscribe(() => retries++);
    await fixture.whenStable();

    const alert: HTMLElement = fixture.nativeElement.querySelector('[role="alert"]');
    expect(alert.textContent).toContain('Falha ao carregar');

    alert.querySelector('button')!.click();
    expect(retries).toBe(1);
  });

  it('hides the retry button when a retry cannot help', async () => {
    fixture.componentRef.setInput('canRetry', false);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('button')).toBeNull();
  });
});
