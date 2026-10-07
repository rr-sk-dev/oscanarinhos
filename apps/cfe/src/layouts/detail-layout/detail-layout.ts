import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { SvgIcon } from '@canarinhos/ngx-cui';

@Component({
  selector: 'app-detail-layout',
  imports: [RouterOutlet, SvgIcon],
  templateUrl: './detail-layout.html',
  styleUrl: './detail-layout.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DetailLayout {
  private location = inject(Location);
  private router = inject(Router);

  goBack(): void {
    // A detail page opened from a shared link has no in-app history: going back would leave the app.
    const hasInAppHistory = !!this.router.lastSuccessfulNavigation()?.previousNavigation;
    if (hasInAppHistory) {
      this.location.back();
    } else {
      this.router.navigateByUrl('/home');
    }
  }
}
