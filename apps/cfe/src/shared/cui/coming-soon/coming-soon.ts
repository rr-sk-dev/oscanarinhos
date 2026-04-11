import { NgClass, NgStyle } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';

type ComingSoonVariant = 'badge' | 'card' | 'full';

@Component({
  selector: 'cui-coming-soon',
  imports: [NgClass, NgStyle],
  templateUrl: './coming-soon.html',
  styleUrl: './coming-soon.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComingSoon {
  // Content
  message = input<string>('Coming Soon');
  description = input<string>();

  // Styling
  variant = input<ComingSoonVariant>('badge');
  showDot = input(true);
  animate = input(true);

  // Colors
  backgroundColor = input<string>('var(--cui-blue-600)');
  textColor = input<string>('var(--cui-white)');

  // Computed classes based on variant
  protected containerClasses = computed(() => {
    const variant = this.variant();
    const baseClasses = ['coming-soon-container'];

    switch (variant) {
      case 'badge':
        baseClasses.push(
          'inline-flex',
          'items-center',
          'gap-2',
          'px-4',
          'py-2',
          'rounded-full',
          'text-sm',
          'font-semibold'
        );
        break;
      case 'card':
        baseClasses.push(
          'flex',
          'flex-col',
          'items-center',
          'justify-center',
          'gap-3',
          'p-8',
          'rounded-2xl',
          'text-center',
          'shadow-lg'
        );
        break;
      case 'full':
        baseClasses.push(
          'flex',
          'flex-col',
          'items-center',
          'justify-center',
          'gap-4',
          'p-12',
          'text-center',
          'h-full'
        );
        break;
    }

    return baseClasses.join(' ');
  });

  // Computed text size based on variant
  protected textSizeClasses = computed(() => {
    const variant = this.variant();

    switch (variant) {
      case 'badge':
        return 'text-sm';
      case 'card':
        return 'text-lg font-bold';
      case 'full':
        return 'text-3xl md:text-4xl font-bold';
      default:
        return 'text-sm';
    }
  });

  // Computed description size based on variant
  protected descriptionSizeClasses = computed(() => {
    const variant = this.variant();

    switch (variant) {
      case 'card':
        return 'text-sm';
      case 'full':
        return 'text-base md:text-lg';
      default:
        return 'text-xs';
    }
  });

  // Computed dot size based on variant
  protected dotSizeClasses = computed(() => {
    const variant = this.variant();

    switch (variant) {
      case 'badge':
        return 'w-2 h-2';
      case 'card':
        return 'w-3 h-3';
      case 'full':
        return 'w-4 h-4';
      default:
        return 'w-2 h-2';
    }
  });

  // Computed styles
  protected containerStyle = computed(() => ({
    'background-color': this.backgroundColor(),
    color: this.textColor(),
  }));
}
