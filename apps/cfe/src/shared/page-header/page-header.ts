import { Component, input } from '@angular/core';

/**
 * A tab page's title and subtitle, left-aligned under the safe area. Actions (e.g. icon buttons)
 * are projected to the right.
 */
@Component({
  selector: 'app-page-header',
  host: { class: 'block' },
  template: `
    <header
      class="max-w-5xl mx-auto flex items-center justify-between gap-3 px-[18px] pt-[calc(env(safe-area-inset-top)+1rem)] pb-3.5 md:pt-10"
    >
      <div class="min-w-0">
        <h1 class="font-display text-[40px] leading-none tracking-[0.02em] text-cui-ink">
          {{ title() }}
        </h1>
        @if (subtitle(); as text) {
          <p class="mt-0.5 text-xs text-cui-ink-2">{{ text }}</p>
        }
      </div>
      <ng-content />
    </header>
  `,
})
export class PageHeader {
  title = input.required<string>();
  subtitle = input<string>();
}
