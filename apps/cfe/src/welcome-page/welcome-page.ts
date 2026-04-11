import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Button, ImageOverlay } from '@canarinhos/ngx-cui';
import { TeamService } from '../team/team.service';

@Component({
  selector: 'app-welcome-page',
  imports: [ImageOverlay, Button],
  templateUrl: './welcome-page.html',
  styleUrl: './welcome-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WelcomePage {
  protected teamLogo = inject(TeamService).logo;

  private router = inject(Router);

  navigateTo(target: string) {
    this.router.navigate([`/${target}`]);
  }

  openCifPage() {
    window.open(
      'https://www.cif.org.pt/futebol/torneio-cif-2024-2025/classificacao'
    );
  }
}
