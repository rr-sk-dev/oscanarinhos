import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SvgIcon } from '@canarinhos/ngx-cui';
import {
  LeadershipRole,
  Player,
  PlayerPosition,
  PlayerStatus,
  TeamStaff,
} from '@canarinhos/shared-types';
import { SquadService } from './squad.service';
import { StaffService } from './staff.service';
import { STAFF_ROLE_ORDER, staffRoleLabel } from './staff-role-labels';

interface PositionGroup {
  position: PlayerPosition;
  label: string;
  players: Player[];
}

const POSITION_GROUP_ORDER: PlayerPosition[] = [
  PlayerPosition.GK,
  PlayerPosition.DEF,
  PlayerPosition.MID,
  PlayerPosition.FWD,
];

const POSITION_GROUP_LABELS: Record<PlayerPosition, string> = {
  [PlayerPosition.GK]: 'Guarda-Redes',
  [PlayerPosition.DEF]: 'Defesas',
  [PlayerPosition.MID]: 'Médios',
  [PlayerPosition.FWD]: 'Avançados',
};

const STATUS_INDICATORS: Partial<Record<PlayerStatus, string>> = {
  [PlayerStatus.INJURED]: 'Lesionado',
  [PlayerStatus.SUSPENDED]: 'Suspenso',
};

function staffRoleRank(role: string): number {
  const index = STAFF_ROLE_ORDER.indexOf(role);
  return index === -1 ? STAFF_ROLE_ORDER.length : index;
}

@Component({
  selector: 'app-squad',
  imports: [RouterLink, SvgIcon],
  templateUrl: './squad.html',
  styleUrl: './squad.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Squad {
  private squadService = inject(SquadService);
  private staffService = inject(StaffService);

  protected players = this.squadService.players;
  protected loading = this.squadService.loading;
  protected error = this.squadService.error;

  protected staff = this.staffService.staff;
  protected staffLoading = this.staffService.loading;

  protected groupedPlayers = computed<PositionGroup[]>(() => {
    const all = this.players();
    return POSITION_GROUP_ORDER.map((position) => ({
      position,
      label: POSITION_GROUP_LABELS[position],
      players: all
        .filter((p) => p.position === position)
        .sort((a, b) => (a.shirtNumber ?? 99) - (b.shirtNumber ?? 99)),
    })).filter((group) => group.players.length > 0);
  });

  protected sortedStaff = computed<TeamStaff[]>(() =>
    [...this.staff()].sort((a, b) => staffRoleRank(a.role) - staffRoleRank(b.role)),
  );

  protected isCaptain(player: Player): boolean {
    return player.leadershipRole === LeadershipRole.CAPTAIN;
  }

  protected isViceCaptain(player: Player): boolean {
    return player.leadershipRole === LeadershipRole.VICE_CAPTAIN;
  }

  protected statusIndicator(player: Player): string | null {
    return STATUS_INDICATORS[player.status] ?? null;
  }

  protected staffRoleLabel(role: string): string {
    return staffRoleLabel(role);
  }
}
