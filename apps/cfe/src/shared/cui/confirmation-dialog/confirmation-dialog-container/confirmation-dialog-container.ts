import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ConfirmationDialog } from '../confirmation-dialog';
import { ConfirmationDialogService } from '../confirmation-dialog.service';

@Component({
  selector: 'cui-confirmation-dialog-container',
  imports: [ConfirmationDialog],
  templateUrl: './confirmation-dialog-container.html',
  styleUrl: './confirmation-dialog-container.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmationDialogContainer {
  protected confirmationService = inject(ConfirmationDialogService);

  protected onConfirm(): void {
    this.confirmationService.handleConfirm();
  }

  protected onCancel(): void {
    this.confirmationService.handleCancel();
  }
}
