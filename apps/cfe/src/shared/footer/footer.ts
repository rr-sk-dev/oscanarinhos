import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SvgIcon } from '@canarinhos/ngx-cui';
import { APP_CONSTANTS } from '../app.constants';

@Component({
  selector: 'app-footer',
  imports: [SvgIcon],
  templateUrl: './footer.html',
  styleUrl: './footer.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Footer {
  protected readonly teamName = APP_CONSTANTS.teamName;
  protected readonly instagramUrl = APP_CONSTANTS.instagram.url;
  protected readonly currentYear = new Date().getFullYear();
}
