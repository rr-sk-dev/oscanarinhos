import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  input,
  output,
  viewChild,
} from '@angular/core';

@Component({
  selector: 'cui-modal',
  imports: [],
  templateUrl: './modal.html',
  styleUrl: './modal.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Modal {
  // Inputs
  isOpen = input.required<boolean>();
  title = input<string>('');
  showCloseButton = input(true);
  closeOnBackdropClick = input(true);
  size = input<'sm' | 'md' | 'lg' | 'xl'>('md');
  hasFooter = input(false);

  // Outputs
  close = output<void>();

  // View children
  private modalContent = viewChild<ElementRef>('modalContent');

  // Computed
  protected modalClasses = computed(() => {
    const sizeClasses = {
      sm: 'max-w-sm',
      md: 'max-w-md',
      lg: 'max-w-lg',
      xl: 'max-w-xl',
    };

    return `bg-cui-surface rounded-lg shadow-xl w-full ${
      sizeClasses[this.size()]
    } animate-slide-up`;
  });

  constructor() {
    // Handle ESC key to close modal
    effect(() => {
      if (this.isOpen()) {
        const handleEscape = (event: KeyboardEvent) => {
          if (event.key === 'Escape') {
            this.close.emit();
          }
        };

        document.addEventListener('keydown', handleEscape);

        // Cleanup
        return () => {
          document.removeEventListener('keydown', handleEscape);
        };
      }
      return;
    });
  }

  protected onBackdropClick(): void {
    if (this.closeOnBackdropClick()) {
      this.close.emit();
    }
  }
}
