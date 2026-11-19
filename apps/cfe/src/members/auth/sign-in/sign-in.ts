import { Component, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Button, TextField } from '@canarinhos/ngx-cui';
import { AuthService } from '../auth.service';

const DEFAULT_DESTINATION = '/home';

/** Only same-app paths are allowed, so `next` cannot send the member to another site. */
function safeDestination(next: string | undefined): string {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : DEFAULT_DESTINATION;
}

@Component({
  selector: 'app-sign-in',
  imports: [Button, TextField],
  templateUrl: './sign-in.html',
})
export class SignIn {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  next = input<string>();

  protected readonly email = signal('');
  protected readonly code = signal('');
  protected readonly isCodeRequested = signal(false);
  protected readonly isBusy = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected async submit(event: Event): Promise<void> {
    event.preventDefault();
    if (this.isBusy()) {
      return;
    }
    this.isBusy.set(true);
    this.errorMessage.set(null);
    try {
      if (this.isCodeRequested()) {
        await this.verify();
      } else {
        await this.requestCode();
      }
    } finally {
      this.isBusy.set(false);
    }
  }

  private async requestCode(): Promise<void> {
    try {
      await this.auth.requestCode(this.email().trim());
      this.isCodeRequested.set(true);
    } catch {
      this.errorMessage.set('Não foi possível enviar o código. Tenta novamente.');
    }
  }

  private async verify(): Promise<void> {
    try {
      await this.auth.verify(this.email().trim(), this.code().trim());
    } catch {
      this.errorMessage.set('Código inválido ou expirado.');
      return;
    }
    await this.router.navigateByUrl(safeDestination(this.next()));
  }
}
