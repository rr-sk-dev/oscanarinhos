import { Injectable, inject } from '@angular/core';
import { Match, TeamResult } from '@canarinhos/shared-types';
import { TeamService } from '../team/team.service';

@Injectable({
  providedIn: 'root',
})
export class MatchUtilsService {
  private teamService = inject(TeamService);

  getTeamName(teamId: string): string {
    const details = this.teamService.details();
    if (details && teamId === details.id) {
      return details.name;
    }
    return 'Adversário';
  }

  getTeamLogo(teamId: string): string | null {
    const details = this.teamService.details();
    if (details && teamId === details.id) {
      return details.logo;
    }
    return null;
  }

  formatKickoff(
    kickoffAt: string,
    options?: Intl.DateTimeFormatOptions,
  ): string {
    if (!kickoffAt) return 'Data a definir';

    try {
      const date = new Date(kickoffAt);
      if (isNaN(date.getTime())) return 'Data a definir';

      return date.toLocaleDateString(
        'pt-PT',
        options ?? {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          hour: '2-digit',
          minute: '2-digit',
        },
      );
    } catch {
      return 'Data a definir';
    }
  }

  formatTime(kickoffAt: string): string {
    if (!kickoffAt) return '';
    try {
      const date = new Date(kickoffAt);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  }

  getMatchInfo(match: Match): string {
    const parts = ['Torneio CIF 2025/26'];
    if (match.journey) {
      parts.push(`Jornada ${match.journey}`);
    }
    return parts.join(' \u2022 ');
  }

  getTeamResult(match: Match, teamName: string): TeamResult | null {
    if (match.homeScore === null || match.awayScore === null) return null;

    const isHome = match.homeTeam?.name === teamName;
    const isAway = match.awayTeam?.name === teamName;
    if (!isHome && !isAway) return null;

    if (match.homeScore === match.awayScore) return TeamResult.DRAW;

    if (isHome) {
      return match.homeScore > match.awayScore
        ? TeamResult.WIN
        : TeamResult.LOSS;
    }

    return match.awayScore > match.homeScore
      ? TeamResult.WIN
      : TeamResult.LOSS;
  }

  getResultBadgeClass(match: Match, teamName: string): string {
    const result = this.getTeamResult(match, teamName);
    switch (result) {
      case TeamResult.WIN:
        return 'bg-green-500/20 text-green-400';
      case TeamResult.LOSS:
        return 'bg-red-500/20 text-red-400';
      case TeamResult.DRAW:
        return 'bg-white/15 text-white/70';
      default:
        return 'bg-white/15 text-white/70';
    }
  }
}
