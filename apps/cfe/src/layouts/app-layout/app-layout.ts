import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BottomTabBar } from '../../shared/bottom-tab-bar/bottom-tab-bar';
import { Footer, FooterSocialLink, FooterSponsor } from '../../shared/footer/footer';
import { SlimTopBar } from '../../shared/slim-top-bar/slim-top-bar';
import { APP_CONSTANTS } from '../../shared/app.constants';

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, SlimTopBar, BottomTabBar, Footer],
  templateUrl: './app-layout.html',
  styleUrl: './app-layout.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppLayout {
  protected readonly teamName = APP_CONSTANTS.teamName;
  protected readonly sponsors: FooterSponsor[] = [];
  protected readonly socialLinks: FooterSocialLink[] = [
    { platform: 'instagram', url: APP_CONSTANTS.instagram.url },
  ];
}
