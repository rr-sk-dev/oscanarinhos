import { inject, Service } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { APP_CONSTANTS } from '../shared/app.constants';

/** Sets the tab title to "<route title> | <team name>", or just the team name. */
@Service()
export class AppTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);

  override updateTitle(snapshot: RouterStateSnapshot): void {
    const routeTitle = this.buildTitle(snapshot);
    this.title.setTitle(
      routeTitle ? `${routeTitle} | ${APP_CONSTANTS.teamName}` : APP_CONSTANTS.teamName,
    );
  }
}
