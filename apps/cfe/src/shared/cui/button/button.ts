import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
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
      this.disabled() ? 'opacity-50 cursor-not-allowed' : 'hover:cursor-pointer',
    ];

    const variant = this.variant();

    const variantClasses: Record<Variant, string> = {
      primary:
        'bg-cui-primary text-cui-text-on-primary hover:bg-cui-primary-hover active:bg-cui-primary-active focus:ring-cui-primary shadow-md hover:shadow-lg disabled:hover:shadow-md disabled:hover:bg-cui-primary',
      secondary:
        'bg-cui-surface-2 text-cui-ink hover:bg-cui-draw-bg active:bg-cui-line focus:ring-cui-line backdrop-blur-sm disabled:hover:bg-cui-surface-2',
      tertiary:
        'bg-transparent text-cui-ink-2 hover:bg-cui-draw-bg active:bg-cui-line disabled:hover:bg-transparent',
    };

    return [...baseClasses, variantClasses[variant]].join(' ');
  });

  handleClick() {
    if (!this.disabled()) {
      this.onClick.emit();
    }
  }
}
