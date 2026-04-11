import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { Modal } from '../modal/modal';

export interface ConfirmationConfig {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmButtonClass?: string;
  isDangerous?: boolean;
}

@Component({
  selector: 'cui-confirmation-dialog',
  imports: [Modal],
  templateUrl: './confirmation-dialog.html',
  styleUrl: './confirmation-dialog.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmationDialog {
  // Inputs
  isOpen = input.required<boolean>();
  config = input.required<ConfirmationConfig>();

  // Outputs
  confirm = output<void>();
  cancel = output<void>();

  protected confirmButtonClass = (): string => {
    const baseClass =
      'px-4 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
    const customClass = this.config().confirmButtonClass;

    if (customClass) {
      return `${baseClass} ${customClass}`;
    }

    // Default: danger button for isDangerous, primary otherwise
    if (this.config().isDangerous) {
      return `${baseClass} bg-cui-error hover:bg-cui-error-dark text-white focus:ring-cui-error`;
    }

    return `${baseClass} bg-cui-primary hover:bg-cui-primary-hover text-cui-text-on-primary focus:ring-cui-primary`;
  };

  protected onConfirm(): void {
    this.confirm.emit();
  }

  protected onCancel(): void {
    this.cancel.emit();
  }
}
