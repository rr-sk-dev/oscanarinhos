import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AttendanceMark, AvailabilitySummary, MemberResponse } from '@canarinhos/shared-types';
import { AttendancePanel } from './attendance-panel';

function aMember(name: string): MemberResponse {
  return { membershipId: `m-${name}`, displayName: name, role: 'PLAYER', note: null };
}

const summary: AvailabilitySummary = {
  yes: [aMember('Ana'), aMember('Rui')],
  maybe: [aMember('Bia')],
  no: [aMember('Carlos')],
  noAnswer: [aMember('Dina')],
};

describe('AttendancePanel', () => {
  let fixture: ComponentFixture<AttendancePanel>;
  let element: HTMLElement;
  let emitted: AttendanceMark[][];

  beforeEach(() => {
    emitted = [];
    fixture = TestBed.createComponent(AttendancePanel);
    fixture.componentRef.setInput('summary', summary);
    fixture.componentInstance.saved.subscribe((entries) => emitted.push(entries));
    element = fixture.nativeElement;
    fixture.detectChanges();
  });

  function box(name: string): HTMLInputElement {
    return element.querySelector<HTMLInputElement>(`input[name="attended-m-${name}"]`)!;
  }

  function save(): void {
    element.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
  }

  it('lists everyone and pre-checks the YES answers', () => {
    expect(element.querySelectorAll('input[type="checkbox"]').length).toBe(5);
    expect(box('Ana').checked).toBe(true);
    expect(box('Rui').checked).toBe(true);
    expect(box('Bia').checked).toBe(false);
    expect(box('Carlos').checked).toBe(false);
    expect(box('Dina').checked).toBe(false);
  });

  it('emits an entry for each member with the ticked state', () => {
    box('Bia').click();
    box('Rui').click();
    save();

    expect(emitted).toHaveLength(1);
    expect(emitted[0]).toEqual([
      { membershipId: 'm-Ana', attended: true },
      { membershipId: 'm-Rui', attended: false },
      { membershipId: 'm-Bia', attended: true },
      { membershipId: 'm-Carlos', attended: false },
      { membershipId: 'm-Dina', attended: false },
    ]);
  });

  it('keeps manual ticks when the summary refreshes', () => {
    box('Dina').click();
    fixture.componentRef.setInput('summary', { ...summary, yes: [...summary.yes] });
    fixture.detectChanges();

    expect(box('Dina').checked).toBe(true);
  });

  it('reopens with a saved false even though the member answered YES', () => {
    fixture.componentRef.setInput('savedMarks', [
      { membershipId: 'm-Ana', attended: false },
      { membershipId: 'm-Dina', attended: true },
    ]);
    fixture.detectChanges();

    expect(box('Ana').checked).toBe(false);
    expect(box('Dina').checked).toBe(true);
    expect(box('Rui').checked).toBe(true);
  });

  it('lets a manual tick win over a saved mark', () => {
    fixture.componentRef.setInput('savedMarks', [{ membershipId: 'm-Ana', attended: false }]);
    fixture.detectChanges();
    box('Ana').click();

    expect(box('Ana').checked).toBe(true);
  });

  it('disables saving while a save is in progress', () => {
    fixture.componentRef.setInput('isSaving', true);
    fixture.detectChanges();

    expect(element.querySelector<HTMLButtonElement>('button[type="submit"]')!.disabled).toBe(true);
  });
});
