import { computed, Service } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { Standing } from '@canarinhos/shared-types';
import { environment } from '../environments/environment';
import { APP_CONSTANTS } from '../shared/app.constants';
import { reloadOnResume } from '../shared/data-refresh';
import { valueOr } from '../shared/resource-value';
import { StandingRow } from '../shared/standings-table/standings-table';

/** The current season's full league table, with our row marked. */
@Service()
export class LeagueTableService {
  private readonly baseUrl = environment.apiUrl;
  // The API finds our row by this name too (standings context endpoint).
  private readonly ourTeamName = environment.team.slug.toLowerCase();

  private readonly resource = httpResource<Standing[]>(
    () => `${this.baseUrl}/api/standings/${APP_CONSTANTS.season.id}`,
    { defaultValue: [] },
  );

  private readonly table = valueOr(this.resource, []);
  readonly rows = computed<StandingRow[]>(() =>
    this.table().map((standing) => ({
      standing,
      isOurTeam: standing.teamName.toLowerCase() === this.ourTeamName,
    })),
  );
  readonly ourStanding = computed(() => this.rows().find((row) => row.isOurTeam)?.standing);
  readonly loading = this.resource.isLoading;
  readonly error = computed(() =>
    this.resource.error() ? 'Falha ao carregar a classificação' : null,
  );

  constructor() {
    reloadOnResume(this.resource);
  }

  reload(): void {
    this.resource.reload();
  }
}
