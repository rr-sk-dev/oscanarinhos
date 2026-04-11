import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  Player,
  LeadershipRole,
  PlayerPosition,
  PlayerFoot,
  PlayerStatus,
} from '@canarinhos/shared-types';
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

const LEADERSHIP_LABELS: Record<LeadershipRole, string> = {
  [LeadershipRole.NONE]: '',
  [LeadershipRole.CAPTAIN]: 'Capitão',
  [LeadershipRole.VICE_CAPTAIN]: 'Vice-Capitão',
};

@Component({
  selector: 'app-player-details',
  imports: [],
  templateUrl: './player-details.html',
  styleUrl: './player-details.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlayerDetails {
  private squadService = inject(SquadService);
  private route = inject(ActivatedRoute);

  private playerId = this.route.snapshot.params['id'] as string | undefined;

  protected player = computed<Player | undefined>(() => {
    return this.playerId
      ? this.squadService.getPlayer(this.playerId)
      : undefined;
  });

  protected loading = this.squadService.loading;

  protected error = computed(() => {
    if (!this.playerId) return 'ID do jogador não encontrado';
    if (!this.squadService.loading() && !this.player()) {
      return 'Jogador não encontrado';
    }
    return this.squadService.error();
  });

  protected getFullName(player: Player): string {
    return player.fullName || `${player.firstName} ${player.lastName}`;
  }

  protected getPositionLabel(position: PlayerPosition): string {
    return POSITION_LABELS[position] || position;
  }

  protected getPreferredFootLabel(foot: PlayerFoot): string {
    return PREFERRED_FOOT_LABELS[foot] || foot;
  }

  protected getStatusLabel(status: PlayerStatus): string {
    return STATUS_LABELS[status] || status;
  }

  protected getLeadershipLabel(role: LeadershipRole): string {
    return LEADERSHIP_LABELS[role] || '';
  }

  protected hasLeadershipRole(player: Player): boolean {
    return player.leadershipRole !== LeadershipRole.NONE;
  }

  protected formatDateOfBirth(date: string | null | undefined): string {
    if (!date) return '\u2014';

    const dateObj = new Date(date);
    const day = dateObj.getDate().toString().padStart(2, '0');
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const year = dateObj.getFullYear();

    return `${day}/${month}/${year}`;
  }

  protected calculateAge(date: string | null | undefined): number | null {
    if (!date) return null;

    const dateObj = new Date(date);
    const today = new Date();
    let age = today.getFullYear() - dateObj.getFullYear();
    const monthDiff = today.getMonth() - dateObj.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < dateObj.getDate())
    ) {
      age--;
    }

    return age;
  }

  protected getStatusClass(status: PlayerStatus): string {
    switch (status) {
      case PlayerStatus.ACTIVE:
        return 'bg-green-100 text-green-700';
      case PlayerStatus.INJURED:
        return 'bg-red-100 text-red-700';
      case PlayerStatus.SUSPENDED:
        return 'bg-orange-100 text-orange-700';
      case PlayerStatus.UNAVAILABLE:
        return 'bg-gray-100 text-gray-700';
      case PlayerStatus.RETIRED:
        return 'bg-gray-200 text-gray-600';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  }
}
