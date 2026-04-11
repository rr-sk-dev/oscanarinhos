import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { IconName, SvgIcon } from '../svg-icon/svg-icon';

type Variant = 'primary' | 'secondary' | 'tertiary';
type IconPosition = 'left' | 'right';

@Component({
  selector: 'cui-button',
  imports: [CommonModule, SvgIcon],
  templateUrl: './button.html',
  styleUrl: './button.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Button {
  variant = input<Variant>('primary');
  fullWidth = input(false);
  disabled = input(false);
  icon = input<IconName>();
  iconPosition = input<IconPosition>('left');
  iconSize = input<number>(20);

  onClick = output<void>();

  cssClasses = computed(() => {
    const baseClasses = [
      this.fullWidth() ? 'w-full' : '',
      'px-6 py-4 rounded-xl font-semibold',
      'transition-all duration-200',
      'focus:outline-none focus:ring-2 focus:ring-opacity-50',
      this.disabled()
        ? 'opacity-50 cursor-not-allowed'
        : 'hover:cursor-pointer',
    ];

    const variant = this.variant();

    const variantClasses: Record<Variant, string> = {
      primary:
        'bg-cui-primary text-cui-text-on-primary hover:bg-cui-primary-hover active:bg-cui-primary-active focus:ring-cui-primary shadow-md hover:shadow-lg disabled:hover:shadow-md disabled:hover:bg-cui-primary',
      secondary:
        'bg-cui-gray-700/50 text-cui-text-primary hover:bg-cui-gray-600/50 active:bg-cui-gray-500/50 focus:ring-cui-gray-500 backdrop-blur-sm disabled:hover:bg-cui-gray-700/50',
      tertiary:
        'bg-transparent text-cui-text-secondary hover:bg-cui-gray-100 active:bg-cui-gray-200 disabled:hover:bg-transparent',
    };

    return [...baseClasses, variantClasses[variant]].join(' ');
  });

  handleClick() {
    if (!this.disabled()) {
      this.onClick.emit();
    }
  }
}
