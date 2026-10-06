import {
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  input,
  output,
  viewChild,
} from '@angular/core';

type ModalSize = 'sm' | 'md' | 'lg' | 'xl';

const SIZE_CLASSES: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
};

let nextId = 0;

/**
 * Modal built on the native <dialog>, which provides the focus trap, focus restore,
 * Escape handling and inert background. The parent owns `isOpen` and resets it on `closed`.
 */
@Component({
  selector: 'cui-modal',
  imports: [],
  templateUrl: './modal.html',
  styleUrl: './modal.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Modal {
  isOpen = input.required<boolean>();
  title = input<string>('');
  showCloseButton = input(true);
  closeOnBackdropClick = input(true);
  size = input<ModalSize>('md');
  hasFooter = input(false);

  closed = output<void>();

  protected readonly titleId = `cui-modal-title-${nextId++}`;
  protected readonly sizeClass = computed(() => SIZE_CLASSES[this.size()]);

  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  constructor() {
    afterRenderEffect(() => {
      const dialog = this.dialog().nativeElement;
      if (this.isOpen() && !dialog.open) {
        dialog.showModal();
      } else if (!this.isOpen() && dialog.open) {
        dialog.close();
      }
    });
  }

  protected requestClose(): void {
    this.closed.emit();
  }

  /** The dialog closed itself (Escape): tell the parent so `isOpen` follows. */
  protected onNativeClose(): void {
    if (this.isOpen()) {
      this.closed.emit();
    }
  }

  /** Clicks on the ::backdrop target the <dialog> itself; clicks on the content do not. */
  protected onDialogClick(event: MouseEvent): void {
    if (event.target === this.dialog().nativeElement && this.closeOnBackdropClick()) {
      this.closed.emit();
    }
  }
}
