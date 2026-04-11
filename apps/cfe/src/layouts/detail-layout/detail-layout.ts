import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { RouterOutlet } from '@angular/router';
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

  goBack(): void {
    this.location.back();
  }
}
