import { Component, computed, inject, input } from '@angular/core';
import { LeadershipRole, PlayerFoot, PlayerPosition, PlayerStatus } from '@canarinhos/shared-types';
import { AgePipe } from '../../pipes/age.pipe';
import { BirthDatePipe } from '../../pipes/birth-date.pipe';
import { SquadService } from '../squad.service';

const POSITION_LABELS: Record<PlayerPosition, string> = {
  [PlayerPosition.GK]: 'Guarda-Redes',
  [PlayerPosition.DEF]: 'Defesa',
  [PlayerPosition.MID]: 'Médio',
  [PlayerPosition.FWD]: 'Avançado',
};

const PREFERRED_FOOT_LABELS: Record<PlayerFoot, string> = {
  [PlayerFoot.LEFT]: 'Esquerdo',
  [PlayerFoot.RIGHT]: 'Direito',
  [PlayerFoot.BOTH]: 'Ambidestro',
};

const STATUS_LABELS: Record<PlayerStatus, string> = {
  [PlayerStatus.ACTIVE]: 'Ativo',
  [PlayerStatus.INJURED]: 'Lesionado',
  [PlayerStatus.SUSPENDED]: 'Suspenso',
  [PlayerStatus.UNAVAILABLE]: 'Indisponível',
  [PlayerStatus.RETIRED]: 'Retirado',
};

const STATUS_CLASSES: Record<PlayerStatus, string> = {
  [PlayerStatus.ACTIVE]: 'bg-cui-win-bg text-cui-win',
  [PlayerStatus.INJURED]: 'bg-cui-loss-bg text-cui-loss',
  [PlayerStatus.SUSPENDED]: 'bg-cui-loss-bg text-cui-loss',
  [PlayerStatus.UNAVAILABLE]: 'bg-cui-draw-bg text-cui-draw',
  [PlayerStatus.RETIRED]: 'bg-cui-draw-bg text-cui-draw',
};

const LEADERSHIP_LABELS: Record<LeadershipRole, string> = {
  [LeadershipRole.NONE]: '',
  [LeadershipRole.CAPTAIN]: 'Capitão',
  [LeadershipRole.VICE_CAPTAIN]: 'Vice-Capitão',
};

@Component({
  selector: 'app-player-details',
  imports: [AgePipe, BirthDatePipe],
  templateUrl: './player-details.html',
  styleUrl: './player-details.css',
})
export class PlayerDetails {
  /** Route param, bound by withComponentInputBinding. */
  readonly id = input.required<string>();

  private squadService = inject(SquadService);

  protected readonly positionLabels = POSITION_LABELS;
  protected readonly preferredFootLabels = PREFERRED_FOOT_LABELS;
  protected readonly statusLabels = STATUS_LABELS;
  protected readonly statusClasses = STATUS_CLASSES;
  protected readonly leadershipLabels = LEADERSHIP_LABELS;

  protected player = computed(() => this.squadService.getPlayer(this.id()));

  protected fullName = computed(() => {
    const player = this.player();
    if (!player) {
      return '';
    }
    return player.fullName || `${player.firstName} ${player.lastName}`;
  });

  protected loading = this.squadService.loading;

  protected error = computed(() => {
    const loadError = this.squadService.error();
    if (loadError) {
      return loadError;
    }
    return !this.loading() && !this.player() ? 'Jogador não encontrado' : null;
  });
}
