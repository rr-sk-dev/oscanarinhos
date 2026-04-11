import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { IconName, SvgIcon } from '@canarinhos/ngx-cui';
import { APP_CONSTANTS } from '../app.constants';

export interface FooterSponsor {
  name: string;
  logoUrl: string;
  url?: string;
}

export type SocialIconName = Extract<
  IconName,
  'facebook' | 'instagram' | 'whatsapp'
>;

export interface FooterSocialLink {
  platform: SocialIconName;
  url: string;
}

@Component({
  selector: 'app-footer',
  imports: [SvgIcon],
  templateUrl: './footer.html',
  styleUrl: './footer.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Footer {
  sponsors = input<FooterSponsor[]>([]);

  socialLinks = input<FooterSocialLink[]>([]);

  companyName = input<string>(APP_CONSTANTS.teamName);

  protected currentYear = new Date().getFullYear();

  protected footerLinks = [
    { label: 'Política de Privacidade', url: 'https://example.com/privacy' },
    { label: 'Termos de Uso', url: 'https://example.com/terms' },
  ];
}
