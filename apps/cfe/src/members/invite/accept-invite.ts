import { HttpClient } from '@angular/common/http';
import { Component, effect, inject, input, signal, untracked } from '@angular/core';
import { Router } from '@angular/router';
import { ErrorState } from '@canarinhos/ngx-cui';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from '../auth/auth.service';

const INVALID_INVITE_MESSAGE = 'Convite inválido ou expirado. Pede um novo convite.';
const GENERIC_ERROR_MESSAGE = 'Não foi possível aceitar o convite. Tenta novamente.';

@Component({
  selector: 'app-accept-invite',
  imports: [ErrorState],
  templateUrl: './accept-invite.html',
})
export class AcceptInvite {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  code = input.required<string>();

  protected readonly errorMessage = signal<string | null>(null);
  protected readonly canRetry = signal(false);

  constructor() {
    effect(() => {
      const code = this.code();
      untracked(() => void this.accept(code));
    });
  }

  protected retry(): void {
    void this.accept(this.code());
  }

  private async accept(code: string): Promise<void> {
    this.errorMessage.set(null);
    try {
      await firstValueFrom(
        this.http.post<unknown>(
          `${environment.apiUrl}/api/invites/${encodeURIComponent(code)}/accept`,
          {},
        ),
      );
    } catch (error) {
      const isInvalid = (error as { status?: number }).status === 400;
      this.canRetry.set(!isInvalid);
      this.errorMessage.set(isInvalid ? INVALID_INVITE_MESSAGE : GENERIC_ERROR_MESSAGE);
      return;
    }
    this.auth.reloadMe();
    await this.router.navigateByUrl('/members');
  }
}
