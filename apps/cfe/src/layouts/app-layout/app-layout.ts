import { ChangeDetectionStrategy, Component, HostListener, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BottomTabBar } from '../../shared/bottom-tab-bar/bottom-tab-bar';
import {
  Footer,
  FooterSocialLink,
  FooterSponsor,
} from '../../shared/footer/footer';
import { SlimTopBar } from '../../shared/slim-top-bar/slim-top-bar';
import { APP_CONSTANTS } from '../../shared/app.constants';
import { TeamService } from '../../team/team.service';

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, SlimTopBar, BottomTabBar, Footer],
  templateUrl: './app-layout.html',
  styleUrl: './app-layout.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppLayout {
  private teamService = inject(TeamService);

  protected teamName = APP_CONSTANTS.teamName;
  protected teamSubtitle = APP_CONSTANTS.teamSubtitle;
  protected teamLogo = this.teamService.logo;
  protected sponsors = signal<FooterSponsor[]>([]);
  protected scrolled = signal(false);

  @HostListener('window:scroll')
  onScroll(): void {
    const isScrolled = window.scrollY > 10;
    if (isScrolled !== this.scrolled()) {
      this.scrolled.set(isScrolled);
    }
  }

  protected socialLinks = signal<FooterSocialLink[]>([
    { platform: 'instagram', url: 'https://instagram.com/oscanarinhos1974' },
  ]);
}
