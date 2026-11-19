import { Component, computed, input, output, signal } from '@angular/core';
import { AttendanceMark, AvailabilitySummary, MemberResponse } from '@canarinhos/shared-types';

/** Who showed up: everyone in the team, ticked by the saved mark, else by a YES answer. */
@Component({
  selector: 'app-attendance-panel',
  host: { class: 'block' },
  templateUrl: './attendance-panel.html',
})
export class AttendancePanel {
  readonly summary = input.required<AvailabilitySummary>();
  /** Marks already saved on the server; they win over the YES-answer default. */
  readonly savedMarks = input<AttendanceMark[]>([]);
  readonly isSaving = input(false);
  readonly saved = output<AttendanceMark[]>();

  /** Ticks the coach changed by hand; they win over the answers, which refresh in the background. */
  private readonly manualTicks = signal<ReadonlyMap<string, boolean>>(new Map());

  protected readonly members = computed<MemberResponse[]>(() => {
    const { yes, maybe, no, noAnswer } = this.summary();
    return [...yes, ...maybe, ...no, ...noAnswer];
  });

  private readonly yesIds = computed(
    () => new Set(this.summary().yes.map((member) => member.membershipId)),
  );

  private readonly savedById = computed(
    () => new Map(this.savedMarks().map((mark) => [mark.membershipId, mark.attended])),
  );

  protected isAttended(membershipId: string): boolean {
    return (
      this.manualTicks().get(membershipId) ??
      this.savedById().get(membershipId) ??
      this.yesIds().has(membershipId)
    );
  }

  protected toggle(membershipId: string): void {
    const next = new Map(this.manualTicks());
    next.set(membershipId, !this.isAttended(membershipId));
    this.manualTicks.set(next);
  }

  protected submit(event: Event): void {
    event.preventDefault();
    if (this.isSaving()) {
      return;
    }
    this.saved.emit(
      this.members().map(({ membershipId }) => ({
        membershipId,
        attended: this.isAttended(membershipId),
      })),
    );
  }
}
