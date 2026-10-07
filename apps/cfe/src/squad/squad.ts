import { NgOptimizedImage } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ErrorState, SvgIcon } from '@canarinhos/ngx-cui';
import {
  LeadershipRole,
  Player,
  PlayerPosition,
  PlayerStatus,
  TeamStaff,
} from '@canarinhos/shared-types';
import { APP_CONSTANTS } from '../shared/app.constants';
import { SquadService } from './squad.service';
import { StaffService } from './staff.service';
import { StaffRolePipe } from './staff-role.pipe';
import { staffRoleRank } from './staff-role-labels';

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

@Component({
  selector: 'app-squad',
  imports: [NgOptimizedImage, ErrorState, RouterLink, SvgIcon, StaffRolePipe],
  templateUrl: './squad.html',
  styleUrl: './squad.css',
})
export class Squad {
  private squadService = inject(SquadService);
  private staffService = inject(StaffService);

  protected readonly captain = LeadershipRole.CAPTAIN;
  protected readonly viceCaptain = LeadershipRole.VICE_CAPTAIN;
  protected readonly statusIndicators = STATUS_INDICATORS;
  protected readonly seasonLabel = APP_CONSTANTS.season.label;

  protected players = this.squadService.players;
  protected loading = this.squadService.loading;
  protected error = this.squadService.error;

  protected retry(): void {
    this.squadService.reload();
  }

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
}
