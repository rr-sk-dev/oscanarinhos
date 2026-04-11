import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { SvgIcon } from '@canarinhos/ngx-cui';
import { APP_CONSTANTS } from '../app.constants';
import { TeamService } from '../../team/team.service';

@Component({
  selector: 'app-slim-top-bar',
  imports: [RouterLink, RouterLinkActive, SvgIcon],
  templateUrl: './slim-top-bar.html',
  styleUrl: './slim-top-bar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SlimTopBar {
  protected items = [
    { label: 'Início', route: '/home' },
    { label: 'Resultados', route: '/results' },
    { label: 'Plantel', route: '/squad' },
    { label: 'Notícias', route: '/news' },
  ];

  protected teamName = APP_CONSTANTS.teamName;
  protected teamLogo = inject(TeamService).logo;

  private router = inject(Router);

  isActive(route: string): boolean {
    return this.router.url.includes(route);
  }
}
