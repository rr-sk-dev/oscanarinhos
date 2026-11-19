import { DecimalPipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ErrorState } from '@canarinhos/ngx-cui';
import { EventType } from '@canarinhos/shared-types';
import { PageHeader } from '../../shared/page-header/page-header';
import { StatsService } from './stats.service';

const TYPE_LABELS: Record<EventType, string> = {
  TRAINING: 'Treino',
  GAME: 'Jogo',
  CUSTOM: 'Evento',
};

/** Estatísticas: attendance per member and turnout per event type. Informational, not a ranking. */
@Component({
  selector: 'app-stats',
  imports: [DecimalPipe, ErrorState, PageHeader, RouterLink],
  templateUrl: './stats.html',
  host: { class: 'block' },
})
export class Stats {
  protected readonly service = inject(StatsService);

  protected readonly members = computed(() =>
    [...this.service.stats().members].sort((a, b) =>
      a.displayName.localeCompare(b.displayName, 'pt'),
    ),
  );
  protected readonly types = computed(() => this.service.stats().byType);

  protected typeLabel(type: EventType): string {
    return TYPE_LABELS[type];
  }
}
