import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { Toast, ToastType } from './toast.service';

@Component({
  selector: 'cui-toast',
  imports: [],
  templateUrl: './toast.html',
  styleUrl: './toast.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastComponent {
  toast = input.required<Toast>();
  close = output<string>();

  protected toastClasses = computed(() => {
    const type = this.toast().type;
    const baseClasses =
      'flex items-center p-4 mb-3 rounded-lg shadow-lg min-w-[320px] max-w-md animate-slide-in';

    const typeClasses: Record<ToastType, string> = {
      success: 'bg-cui-success text-white',
      error: 'bg-cui-error text-white',
      warning: 'bg-cui-warning text-cui-black',
      info: 'bg-cui-info text-white',
    };

    return `${baseClasses} ${typeClasses[type]}`;
  });

  protected icon = computed(() => {
    const icons: Record<ToastType, string> = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ',
    };
    return icons[this.toast().type];
  });

  protected onClose(): void {
    this.close.emit(this.toast().id);
  }
}
