import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';

export type OverlayType = 'solid' | 'gradient';

@Component({
  selector: 'cui-image-overlay',
  imports: [],
  templateUrl: './image-overlay.html',
  styleUrl: './image-overlay.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageOverlay {
  imgSrc = input.required<string>();
  imgUrl = computed(() => `url(${this.imgSrc()})`);
  position = input<string>('center');

  blur = input(false);
  blurIntensity = input<number>(70);
  backdropBlur = input(false);
  overlayType = input<OverlayType>('gradient');

  overlayClasses = computed(() => {
    if (!this.blur()) {
      return '';
    }

    const classes = ['absolute inset-0', 'pointer-events-none'];

    if (this.overlayType() === 'gradient') {
      classes.push(
        'bg-gradient-to-b',
        'from-black/10',
        'via-black/60',
        'to-black/95'
      );
    } else {
      classes.push(`bg-cui-background/${this.blurIntensity()}`);
    }

    if (this.backdropBlur()) {
      classes.push('backdrop-blur-sm');
    }

    return classes.join(' ');
  });
}
