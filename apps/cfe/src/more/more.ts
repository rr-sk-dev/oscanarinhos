import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatchStatus } from '@canarinhos/shared-types';
import { SvgIcon } from '@canarinhos/ngx-cui';
import { NextMatchService } from '../home/next-match.service';
import { ThemeService } from '../shared/theme.service';
import { TeamService } from '../team/team.service';
import { APP_CONSTANTS } from '../shared/app.constants';

@Component({
  selector: 'app-more',
  imports: [RouterLink, SvgIcon],
  templateUrl: './more.html',
  styleUrl: './more.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class More {
  private readonly theme = inject(ThemeService);
  private readonly nextMatch = inject(NextMatchService).match;

  protected readonly teamName = APP_CONSTANTS.teamName;
  protected readonly teamLogo = inject(TeamService).logo;
  protected readonly instagram = {
    handle: '@oscanarinhos1974',
    url: 'https://instagram.com/oscanarinhos1974',
  };

  protected readonly isDark = this.theme.isDark;
  protected readonly isLive = computed(() => this.nextMatch()?.status === MatchStatus.IN_PROGRESS);

  protected toggleTheme(): void {
    this.theme.toggle();
  }
}
