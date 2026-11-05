import { NgOptimizedImage } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
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
import { PageHeader } from '../shared/page-header/page-header';
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

type PositionFilter = PlayerPosition | 'ALL';

const POSITION_FILTERS: { id: PositionFilter; label: string }[] = [
  { id: 'ALL', label: 'Todos' },
  { id: PlayerPosition.GK, label: 'GR' },
  { id: PlayerPosition.DEF, label: 'Defesas' },
  { id: PlayerPosition.MID, label: 'Médios' },
  { id: PlayerPosition.FWD, label: 'Avançados' },
];

const STATUS_INDICATORS: Partial<Record<PlayerStatus, string>> = {
  [PlayerStatus.INJURED]: 'Lesionado',
  [PlayerStatus.SUSPENDED]: 'Suspenso',
};

/** Plantel: player cards grouped by position, with a position filter, then the staff. */
@Component({
  selector: 'app-squad',
  imports: [NgOptimizedImage, ErrorState, PageHeader, RouterLink, SvgIcon, StaffRolePipe],
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
  protected readonly filters = POSITION_FILTERS;
  protected filter = signal<PositionFilter>('ALL');

  protected players = this.squadService.players;
  protected loading = this.squadService.loading;
  protected error = this.squadService.error;

  protected retry(): void {
    this.squadService.reload();
  }

  protected staff = this.staffService.staff;
  protected staffLoading = this.staffService.loading;

  protected subtitle = computed(() => {
    const count = this.players().length;
    const season = `Época ${this.seasonLabel}`;
    return count > 0 ? `${count} jogadores · ${season}` : season;
  });

  protected groupedPlayers = computed<PositionGroup[]>(() => {
    const all = this.players();
    const filter = this.filter();
    return POSITION_GROUP_ORDER.filter((position) => filter === 'ALL' || filter === position)
      .map((position) => ({
        position,
        label: POSITION_GROUP_LABELS[position],
        players: all
          .filter((p) => p.position === position)
          .sort((a, b) => (a.shirtNumber ?? 99) - (b.shirtNumber ?? 99)),
      }))
      .filter((group) => group.players.length > 0);
  });

  protected sortedStaff = computed<TeamStaff[]>(() =>
    [...this.staff()].sort((a, b) => staffRoleRank(a.role) - staffRoleRank(b.role)),
  );
}
