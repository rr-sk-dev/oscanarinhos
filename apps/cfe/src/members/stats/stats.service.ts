import { httpResource } from '@angular/common/http';
import { computed, inject, Service } from '@angular/core';
import { TeamStats } from '@canarinhos/shared-types';
import { environment } from '../../environments/environment';
import { reloadOnResume } from '../../shared/data-refresh';
import { valueOr } from '../../shared/resource-value';
import { AuthService } from '../auth/auth.service';

const EMPTY_STATS: TeamStats = { members: [], byType: [] };

/** Attendance statistics of the active team. No range is sent, so the API uses the season. */
@Service()
export class StatsService {
  private readonly auth = inject(AuthService);

  private readonly resource = httpResource<TeamStats>(() => {
    const teamId = this.auth.activeMembership()?.teamId;
    if (!teamId) {
      return undefined;
    }
    return `${environment.apiUrl}/api/teams/${teamId}/stats`;
  });

  private readonly value = valueOr(this.resource, undefined);
  readonly stats = computed<TeamStats>(() => this.value() ?? EMPTY_STATS);
  readonly isLoading = this.resource.isLoading;
  readonly error = computed(() =>
    this.resource.error() ? 'Falha ao carregar as estatísticas' : null,
  );

  constructor() {
    reloadOnResume(this.resource);
  }

  reload(): void {
    this.resource.reload();
  }
}
