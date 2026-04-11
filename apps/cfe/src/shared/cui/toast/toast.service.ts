import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private toastsSignal = signal<Toast[]>([]);
  toasts = this.toastsSignal.asReadonly();

  success(message: string, duration = 3000): void {
    this.show({ type: 'success', message, duration });
  }

  error(message: string, duration = 5000): void {
    this.show({ type: 'error', message, duration });
  }

  warning(message: string, duration = 4000): void {
    this.show({ type: 'warning', message, duration });
  }

  info(message: string, duration = 3000): void {
    this.show({ type: 'info', message, duration });
  }

  private show(config: Omit<Toast, 'id'>): void {
    const toast: Toast = {
      id: this.generateId(),
      ...config,
    };

    this.toastsSignal.update((toasts) => [...toasts, toast]);

    if (config.duration && config.duration > 0) {
      setTimeout(() => {
        this.dismiss(toast.id);
      }, config.duration);
    }
  }

  dismiss(id: string): void {
    this.toastsSignal.update((toasts) => toasts.filter((t) => t.id !== id));
  }

  dismissAll(): void {
    this.toastsSignal.set([]);
  }

  private generateId(): string {
    return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
