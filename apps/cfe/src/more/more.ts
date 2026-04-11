import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SvgIcon, IconName } from '@canarinhos/ngx-cui';
import { APP_CONSTANTS } from '../shared/app.constants';

interface MoreItem {
  label: string;
  route: string;
  icon: IconName;
  external?: boolean;
}

@Component({
  selector: 'app-more',
  imports: [RouterLink, SvgIcon],
  templateUrl: './more.html',
  styleUrl: './more.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class More {
  protected teamName = APP_CONSTANTS.teamName;

  protected items: MoreItem[] = [
    { label: 'Ao Vivo', route: '/live', icon: 'live' },
  ];

  protected socialLinks = [
    { platform: 'Instagram', url: 'https://instagram.com/oscanarinhos1974', icon: 'instagram' as IconName },
  ];
}
