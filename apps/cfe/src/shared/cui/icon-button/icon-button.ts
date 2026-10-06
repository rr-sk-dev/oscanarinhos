import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

type IconButtonVariant = 'default' | 'ghost' | 'danger';
type IconButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'cui-icon-button',
  imports: [],
  templateUrl: './icon-button.html',
  styleUrl: './icon-button.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IconButton {
  variant = input<IconButtonVariant>('default');
  size = input<IconButtonSize>('md');
  type = input<'button' | 'submit' | 'reset'>('button');

  disabled = input<boolean>(false);
  active = input<boolean>(false);

  ariaLabel = input<string>('');

  clicked = output<MouseEvent>();

  protected buttonClasses = computed(() => {
    const variant = this.variant();
    const size = this.size();
    const isActive = this.active();

    const baseClasses = [
      'cui-icon-button',
      'inline-flex items-center justify-center',
      'rounded-lg',
      'transition-all duration-200',
      'focus:outline-none',
      'disabled:opacity-50 disabled:cursor-not-allowed',
    ];

    const sizeClasses = {
      sm: 'w-8 h-8',
      md: 'w-10 h-10',
      lg: 'w-12 h-12',
    };

    const variantClasses = {
      default: [
        'text-cui-ink-3',
        'hover:text-cui-ink hover:bg-cui-draw-bg',
        'active:bg-cui-line',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-cui-yellow-500',
        isActive ? 'bg-cui-draw-bg text-cui-ink' : '',
      ].join(' '),

      ghost: [
        'text-cui-ink-3',
        'hover:text-cui-ink',
        'active:text-cui-ink-2',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-cui-yellow-500',
        isActive ? 'text-cui-ink' : '',
      ].join(' '),

      danger: [
        'text-cui-error',
        'hover:bg-cui-error/10',
        'active:bg-cui-error/20',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-cui-error',
        isActive ? 'bg-cui-error/10' : '',
      ].join(' '),
    };

    return [...baseClasses, sizeClasses[size], variantClasses[variant]].join(' ');
  });

  protected handleClick(event: MouseEvent): void {
    if (!this.disabled()) {
      this.clicked.emit(event);
    }
  }
}
