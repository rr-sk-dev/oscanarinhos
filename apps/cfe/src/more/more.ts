import { NgOptimizedImage } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SvgIcon } from '@canarinhos/ngx-cui';
import { NextMatchService } from '../home/next-match.service';
import { ThemeService } from '../shared/theme.service';
import { TeamService } from '../team/team.service';
import { APP_CONSTANTS } from '../shared/app.constants';
import { liveStatus } from '../shared/match-status';
import { injectNow } from '../shared/now';

@Component({
  selector: 'app-more',
  imports: [NgOptimizedImage, RouterLink, SvgIcon],
  templateUrl: './more.html',
  styleUrl: './more.css',
})
export class More {
  private readonly theme = inject(ThemeService);
  private readonly nextMatch = inject(NextMatchService).match;
  private readonly now = injectNow(60_000);

  protected readonly teamName = APP_CONSTANTS.teamName;
  protected readonly teamLogo = inject(TeamService).logo;
  protected readonly instagram = APP_CONSTANTS.instagram;

  protected readonly isDark = this.theme.isDark;
  protected readonly isLive = computed(() => {
    const match = this.nextMatch();
    return !!match && liveStatus(match, this.now()) === 'live';
  });

  protected toggleTheme(): void {
    this.theme.toggle();
  }
}
