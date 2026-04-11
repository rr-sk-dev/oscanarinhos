import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';

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
        'text-cui-gray-500',
        'hover:text-cui-text-primary hover:bg-cui-gray-700/30',
        'active:bg-cui-gray-700/50',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-cui-gray-500',
        isActive ? 'bg-cui-gray-700/30 text-cui-text-primary' : '',
      ].join(' '),

      ghost: [
        'text-cui-gray-500',
        'hover:text-cui-text-primary',
        'active:text-cui-text-secondary',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-cui-gray-500',
        isActive ? 'text-cui-text-primary' : '',
      ].join(' '),

      danger: [
        'text-cui-error',
        'hover:bg-cui-error/10',
        'active:bg-cui-error/20',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-cui-error',
        isActive ? 'bg-cui-error/10' : '',
      ].join(' '),
    };

    return [...baseClasses, sizeClasses[size], variantClasses[variant]].join(
      ' '
    );
  });

  protected handleClick(event: MouseEvent): void {
    if (!this.disabled()) {
      this.clicked.emit(event);
    }
  }
}
