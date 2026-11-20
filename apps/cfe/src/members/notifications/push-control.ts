import { Component, input, output } from '@angular/core';
import { Button } from '@canarinhos/ngx-cui';
import { PushStatus } from './push.service';

export type { PushStatus };

/** Notificações: explains why push is unavailable, or lets the member turn it on or off. */
@Component({
  selector: 'app-push-control',
  imports: [Button],
  template: `
    <section class="flex flex-col gap-3 rounded-xl border border-cui-line p-4">
      <h2 class="text-sm font-extrabold text-cui-ink">Notificações</h2>

      @switch (status()) {
        @case ('unsupported') {
          <p class="text-sm text-cui-ink-2">Este navegador não suporta notificações.</p>
        }
        @case ('needs-install') {
          <p class="text-sm text-cui-ink-2">
            Para receber notificações no iPhone ou iPad, abre o menu de partilha do Safari, escolhe
            "Adicionar ao ecrã principal" e abre a app a partir daí.
          </p>
        }
        @case ('blocked') {
          <p class="text-sm text-cui-ink-2">
            As notificações estão bloqueadas. Para as receber, permite-as nas definições do
            navegador.
          </p>
        }
        @case ('off') {
          <p class="text-sm text-cui-ink-2">
            Recebe um aviso neste dispositivo quando um evento for cancelado ou reagendado.
          </p>
          <cui-button [disabled]="isBusy()" (click)="enable.emit()">Ativar notificações</cui-button>
        }
        @case ('on') {
          <p class="text-sm text-cui-ink-2">As notificações estão ativas neste dispositivo.</p>
          <cui-button [disabled]="isBusy()" (click)="disable.emit()">
            Desativar notificações
          </cui-button>
        }
      }

      @if (error(); as message) {
        <p role="alert" class="text-sm text-cui-ink-2">{{ message }}</p>
      }
    </section>
  `,
  host: { class: 'block' },
})
export class PushControl {
  readonly status = input.required<PushStatus>();
  readonly isBusy = input(false);
  readonly error = input<string | null>(null);

  readonly enable = output<void>();
  readonly disable = output<void>();
}
