import { effect, inject, Service, Signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { APP_CONSTANTS } from '../shared/app.constants';

/** "<page> | <team name>", or just the team name. */
export function formatPageTitle(page: string | null | undefined): string {
  return page ? `${page} | ${APP_CONSTANTS.teamName}` : APP_CONSTANTS.teamName;
}

/** Sets the tab title from the route's `title`. */
@Service()
export class AppTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);

  override updateTitle(snapshot: RouterStateSnapshot): void {
    this.title.setTitle(formatPageTitle(this.buildTitle(snapshot)));
  }
}

/**
 * Replaces the route's static title (e.g. "Jogo") with one from the page's data
 * (e.g. "Canarinhos contra Vips") once it is available. Call it in an injection context.
 */
export function injectPageTitle(page: Signal<string | null | undefined>): void {
  const title = inject(Title);
  effect(() => {
    const value = page();
    if (value) {
      title.setTitle(formatPageTitle(value));
    }
  });
}
