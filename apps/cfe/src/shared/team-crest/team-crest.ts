import { NgOptimizedImage } from '@angular/common';
import { Component, computed, input } from '@angular/core';

/**
 * A team's crest, or a placeholder when it has none. Size the host with classes
 * (e.g. `class="w-16 h-16 rounded-xl"`): the crest fills that box, so its space is reserved before
 * it loads and logos of any shape fit. `size` is the box size in px, used for the placeholder.
 * Decorative (`alt=""`): the team name is always shown next to it.
 */
@Component({
  selector: 'app-team-crest',
  imports: [NgOptimizedImage],
  host: {
    class: 'relative flex shrink-0 items-center justify-center',
    '[class.bg-cui-tile-bg]': "!logo() && placeholder() === 'mark'",
    '[class.bg-cui-surface-2]': "!logo() && placeholder() === 'blank'",
  },
  template: `
    @if (logo(); as src) {
      <span class="relative block h-full w-full"
        ><img [ngSrc]="src" alt="" fill class="object-contain"
      /></span>
    } @else if (placeholder() === 'mark') {
      <span class="font-bold text-cui-ink-3" [class]="markClass()">?</span>
    }
  `,
})
export class TeamCrest {
  logo = input<string | null | undefined>();
  size = input.required<number>();
  /** `mark` shows "?" on a tile; `blank` an empty square, for small inline crests. */
  placeholder = input<'mark' | 'blank'>('mark');

  protected markClass = computed(() => (this.size() >= 64 ? 'text-2xl' : 'text-xl'));
}
