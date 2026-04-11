import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { Router } from '@angular/router';
import { HeroSection, SvgIcon } from '@canarinhos/ngx-cui';
import {
  Player,
  LeadershipRole,
  PlayerPosition,
  StaffRole,
  TeamStaff,
} from '@canarinhos/shared-types';
import { SquadService } from './squad.service';
import { StaffService } from './staff.service';
import { TeamService } from '../team/team.service';

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

const STAFF_ROLE_ORDER: StaffRole[] = [
  StaffRole.COACH,
  StaffRole.ASSISTANT_COACH,
  StaffRole.DELEGATE,
];

const STAFF_ROLE_LABELS: Record<StaffRole, string> = {
  [StaffRole.COACH]: 'Treinador',
  [StaffRole.ASSISTANT_COACH]: 'Treinador Adjunto',
  [StaffRole.DELEGATE]: 'Delegado',
};

@Component({
  selector: 'app-squad',
  imports: [HeroSection, SvgIcon],
  templateUrl: './squad.html',
  styleUrl: './squad.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Squad {
  private squadService = inject(SquadService);
  private staffService = inject(StaffService);
  private router = inject(Router);

  protected teamPhoto = inject(TeamService).teamPhoto;

  protected players = this.squadService.players;
  protected loading = this.squadService.loading;
  protected error = this.squadService.error;

  protected staff = this.staffService.staff;
  protected staffLoading = this.staffService.loading;

  protected groupedPlayers = computed<PositionGroup[]>(() => {
    const all = this.players();
    return POSITION_GROUP_ORDER
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
    [...this.staff()].sort(
      (a, b) => STAFF_ROLE_ORDER.indexOf(a.role) - STAFF_ROLE_ORDER.indexOf(b.role),
    ),
  );

  onPlayerClick(playerId: string): void {
    this.router.navigate(['/squad', playerId]);
  }

  onStaffClick(staffId: string): void {
    this.router.navigate(['/staff', staffId]);
  }

  isCaptain(player: Player): boolean {
    return player.leadershipRole === LeadershipRole.CAPTAIN;
  }

  isViceCaptain(player: Player): boolean {
    return player.leadershipRole === LeadershipRole.VICE_CAPTAIN;
  }

  getStaffRoleLabel(role: StaffRole): string {
    return STAFF_ROLE_LABELS[role] ?? role;
  }
}
