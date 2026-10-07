import { Component, input, output } from '@angular/core';

/** Offers to reload into a new app version. */
@Component({
  selector: 'app-update-banner',
  templateUrl: './update-banner.html',
})
export class UpdateBanner {
  visible = input.required<boolean>();
  update = output<void>();
}
