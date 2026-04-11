import { Injectable, signal } from '@angular/core';
import { ConfirmationConfig } from './confirmation-dialog';

export interface ConfirmationState {
  isOpen: boolean;
  config: ConfirmationConfig | null;
  resolve: ((value: boolean) => void) | null;
}

@Injectable({
  providedIn: 'root',
})
export class ConfirmationDialogService {
  private stateSignal = signal<ConfirmationState>({
    isOpen: false,
    config: null,
    resolve: null,
  });

  state = this.stateSignal.asReadonly();

  /**
   * Show confirmation dialog and return a promise
   * Resolves to true if confirmed, false if cancelled
   */
  confirm(config: ConfirmationConfig): Promise<boolean> {
    return new Promise((resolve) => {
      this.stateSignal.set({
        isOpen: true,
        config,
        resolve,
      });
    });
  }

  /**
   * User confirmed the action
   */
  handleConfirm(): void {
    const currentState = this.stateSignal();
    if (currentState.resolve) {
      currentState.resolve(true);
    }
    this.close();
  }

  /**
   * User cancelled the action
   */
  handleCancel(): void {
    const currentState = this.stateSignal();
    if (currentState.resolve) {
      currentState.resolve(false);
    }
    this.close();
  }

  /**
   * Close the dialog
   */
  private close(): void {
    this.stateSignal.set({
      isOpen: false,
      config: null,
      resolve: null,
    });
  }
}
