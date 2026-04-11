import { NgClass, NgStyle } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';

export type FocalPoint =
  | 'center'
  | 'top'
  | 'bottom'
  | 'left'
  | 'right'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';

@Component({
  selector: 'cui-hero-section',
  imports: [NgStyle, NgClass],
  templateUrl: './hero-section.html',
  styleUrl: './hero-section.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroSection {
  // Background
  backgroundImage = input<string>();
  fallbackColor = input<string>('var(--cui-grey-900)');

  /**
   * Focal point of the image - where the main subject is located.
   * This determines which part of the image stays visible when cropped.
   * For team photos with people, use 'top' to keep faces visible.
   * Default: 'center'
   */
  focalPoint = input<FocalPoint | string>('center');

  // Optional text content
  title = input<string>();
  subtitle = input<string>();

  // Accent line under title
  showAccent = input(true);
  accentColor = input<string>('var(--cui-yellow-500)');

  // Layout
  textAlign = input<'left' | 'center'>('left');
  size = input<'sm' | 'md'>('md');

  // Computed object position from focal point
  protected objectPosition = computed(() => {
    const focal = this.focalPoint();

    // Map named focal points to CSS object-position values
    const focalPointMap: Record<FocalPoint, string> = {
      center: 'center center',
      top: 'center 40%',
      bottom: 'center 80%',
      left: '20% center',
      right: '80% center',
      'top-left': '20% 30%',
      'top-right': '80% 30%',
      'bottom-left': '20% 80%',
      'bottom-right': '80% 80%',
    };

    // Allow custom values like "center 30%"
    return focalPointMap[focal as FocalPoint] || focal;
  });

  // Computed text alignment classes
  protected textAlignClasses = computed(() => {
    return this.textAlign() === 'center'
      ? 'text-center items-center'
      : 'text-left items-start';
  });

  protected sizeClasses = computed(() =>
    this.size() === 'sm'
      ? 'h-44 md:h-56'
      : 'h-56 md:h-80 lg:h-[28rem] xl:h-[32rem]',
  );

  // Computed accent line style
  protected accentStyle = computed(() => ({
    'background-color': this.accentColor(),
  }));
}
