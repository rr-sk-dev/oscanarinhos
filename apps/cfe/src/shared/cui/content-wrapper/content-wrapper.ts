import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'cui-content-wrapper',
  imports: [],
  templateUrl: './content-wrapper.html',
  styleUrl: './content-wrapper.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContentWrapper {
  title = input<string>();
  subtitle = input<string>();
  backgroundImage = input<string>();
}
