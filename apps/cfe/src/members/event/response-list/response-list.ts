import { Component, computed, input } from '@angular/core';
import { AvailabilitySummary, MemberResponse } from '@canarinhos/shared-types';

interface ResponseGroup {
  key: string;
  label: string;
  members: MemberResponse[];
}

/** Who answered what, in four groups. Staff appear in the same lists as players. */
@Component({
  selector: 'app-response-list',
  host: { class: 'block' },
  template: `
    @for (group of groups(); track group.key) {
      <section class="mt-4">
        <h3 class="text-xs font-extrabold uppercase tracking-[0.08em] text-cui-ink-3">
          {{ group.label }} ({{ group.members.length }})
        </h3>
        <ul class="mt-1.5 flex flex-col gap-1">
          @for (member of group.members; track member.membershipId) {
            <li class="text-sm text-cui-ink">
              {{ member.displayName }}
              @if (member.note) {
                <span class="text-xs text-cui-ink-2"> · {{ member.note }}</span>
              }
            </li>
          }
        </ul>
      </section>
    }
  `,
})
export class ResponseList {
  readonly summary = input.required<AvailabilitySummary>();

  protected readonly groups = computed<ResponseGroup[]>(() => {
    const summary = this.summary();
    return [
      { key: 'yes', label: 'Vou', members: summary.yes },
      { key: 'maybe', label: 'Talvez', members: summary.maybe },
      { key: 'no', label: 'Não vou', members: summary.no },
      { key: 'noAnswer', label: 'Sem resposta', members: summary.noAnswer },
    ];
  });
}
