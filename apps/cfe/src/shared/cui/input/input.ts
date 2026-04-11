import {
  ChangeDetectionStrategy,
  Component,
  computed,
  forwardRef,
  input,
  output,
  signal,
} from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';

type InputType = 'text' | 'email' | 'password';
type InputSize = 'sm' | 'md' | 'lg';
type InputState = 'default' | 'error' | 'success';
type LabelPosition = 'above' | 'floating';

@Component({
  selector: 'cui-input',
  imports: [],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => Input),
      multi: true,
    },
  ],
  templateUrl: './input.html',
  styleUrl: './input.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Input {
  type = input<InputType>('text');
  size = input<InputSize>('md');
  labelPosition = input<LabelPosition>('above');

  label = input<string>('');
  placeholder = input<string>('');
  hint = input<string>('');
  error = input<string>('');

  disabled = input<boolean>(false);
  readonly = input<boolean>(false);
  required = input<boolean>(false);
  state = input<InputState>('default');

  hasLeadingIcon = input<boolean>(false);
  hasTrailingIcon = input<boolean>(false);

  showPassword = input<boolean>(false);

  focused = output<void>();
  blurred = output<void>();
  valueChanged = output<string>();

  private value = signal<string>('');
  protected isFocused = signal<boolean>(false);

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  protected currentType = computed(() => {
    if (this.type() === 'password' && this.showPassword()) {
      return 'text';
    }
    return this.type();
  });

  protected inputState = computed(() => {
    if (this.error()) return 'error';
    if (this.state() === 'success') return 'success';
    return 'default';
  });

  protected showFloatingLabel = computed(() => {
    return (
      this.labelPosition() === 'floating' &&
      (this.isFocused() || this.value().length > 0)
    );
  });

  protected inputClasses = computed(() => {
    const size = this.size();
    const state = this.inputState();

    const baseClasses = [
      'cui-input',
      'w-full',
      'rounded-lg',
      'font-normal',
      'bg-cui-input',
      'text-cui-text-primary',
      'placeholder:text-cui-text-placeholder',
      'transition-all duration-200',
      'focus:outline-none',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      'read-only:cursor-default',
    ];

    const sizeClasses = {
      sm: ['px-3 py-2 text-sm'],
      md: ['px-4 py-3 text-base'],
      lg: ['px-5 py-4 text-lg'],
    };

    const paddingClasses = [];
    if (this.hasLeadingIcon()) {
      paddingClasses.push(
        size === 'sm' ? 'pl-9' : size === 'md' ? 'pl-10' : 'pl-12'
      );
    }
    if (this.hasTrailingIcon()) {
      paddingClasses.push(
        size === 'sm' ? 'pr-9' : size === 'md' ? 'pr-10' : 'pr-12'
      );
    }

    const stateClasses = {
      default: [
        'border border-cui-border',
        'hover:border-cui-gray-500',
        'focus:border-cui-primary focus:ring-2 focus:ring-cui-primary/20',
      ],
      error: [
        'border border-cui-error',
        'focus:border-cui-error focus:ring-2 focus:ring-cui-error/20',
      ],
      success: [
        'border border-cui-success',
        'focus:border-cui-success focus:ring-2 focus:ring-cui-success/20',
      ],
    };

    return [
      ...baseClasses,
      ...sizeClasses[size],
      ...paddingClasses,
      ...stateClasses[state],
    ].join(' ');
  });

  protected labelClasses = computed(() => {
    const position = this.labelPosition();

    if (position === 'floating') {
      const isFloating = this.showFloatingLabel();
      return [
        'absolute left-4 transition-all duration-200 pointer-events-none',
        isFloating
          ? 'top-0 -translate-y-1/2 text-xs bg-cui-input px-1 text-cui-primary'
          : 'top-1/2 -translate-y-1/2 text-base text-cui-text-placeholder',
      ].join(' ');
    }

    return 'block text-sm font-medium text-cui-text-primary mb-2';
  });

  protected iconContainerClasses = (position: 'leading' | 'trailing') => {
    const size = this.size();
    const baseClasses = [
      'absolute top-1/2 -translate-y-1/2',
      'flex items-center justify-center',
      'text-cui-gray-500',
    ];

    if (position === 'trailing') {
      baseClasses.push('pointer-events-auto');
    } else {
      baseClasses.push('pointer-events-none');
    }

    const sizeClasses = {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6',
    };

    const positionClasses = {
      leading: size === 'sm' ? 'left-3' : size === 'md' ? 'left-3' : 'left-4',
      trailing:
        size === 'sm' ? 'right-3' : size === 'md' ? 'right-3' : 'right-4',
    };

    return [...baseClasses, sizeClasses[size], positionClasses[position]].join(
      ' '
    );
  };

  writeValue(value: string): void {
    this.value.set(value || '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {}

  protected onInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.value.set(value);
    this.onChange(value);
    this.valueChanged.emit(value);
  }

  protected onFocus(): void {
    this.isFocused.set(true);
    this.focused.emit();
  }

  protected onBlur(): void {
    this.isFocused.set(false);
    this.onTouched();
    this.blurred.emit();
  }

  protected getCurrentValue(): string {
    return this.value();
  }
}
