import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { IconName, SvgIcon } from '@canarinhos/ngx-cui';

interface TabItem {
  label: string;
  route: string;
  icon: IconName;
  /** Drawn as the raised yellow button in the middle of the bar. */
  isCentre?: boolean;
}

@Component({
  selector: 'app-bottom-tab-bar',
  imports: [RouterLink, RouterLinkActive, SvgIcon],
  templateUrl: './bottom-tab-bar.html',
  styleUrl: './bottom-tab-bar.css',
})
export class BottomTabBar {
  protected tabs: TabItem[] = [
    { label: 'Início', route: '/home', icon: 'home' },
    { label: 'Jogos', route: '/results', icon: 'calendar' },
    { label: 'Ao Vivo', route: '/live', icon: 'live', isCentre: true },
    { label: 'Plantel', route: '/squad', icon: 'team' },
    { label: 'Notícias', route: '/news', icon: 'news' },
  ];
}
