import { NgOptimizedImage } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { SvgIcon } from '@canarinhos/ngx-cui';
import { APP_CONSTANTS } from '../app.constants';
import { TeamService } from '../../team/team.service';

@Component({
  selector: 'app-slim-top-bar',
  imports: [NgOptimizedImage, RouterLink, RouterLinkActive, SvgIcon],
  templateUrl: './slim-top-bar.html',
  styleUrl: './slim-top-bar.css',
})
export class SlimTopBar {
  protected items = [
    { label: 'Início', route: '/home' },
    { label: 'Resultados', route: '/results' },
    { label: 'Plantel', route: '/squad' },
    { label: 'Notícias', route: '/news' },
    { label: 'Mais', route: '/more' },
  ];

  protected teamName = APP_CONSTANTS.teamName;
  protected teamLogo = inject(TeamService).logo;
}
