import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToastComponent } from '../toast';
import { ToastService } from '../toast.service';

@Component({
  selector: 'cui-toast-container',
  imports: [ToastComponent],
  templateUrl: './toast-container.html',
  styleUrl: './toast-container.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastContainer {
  protected toastService = inject(ToastService);

  protected onClose(id: string): void {
    this.toastService.dismiss(id);
  }
}
