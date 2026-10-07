import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { IconName, SvgIcon } from '@canarinhos/ngx-cui';

interface TabItem {
  label: string;
  route: string;
  icon: IconName;
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
    { label: 'Resultados', route: '/results', icon: 'calendar' },
    { label: 'Plantel', route: '/squad', icon: 'team' },
    { label: 'Notícias', route: '/news', icon: 'news' },
    { label: 'Mais', route: '/more', icon: 'more' },
  ];
}
