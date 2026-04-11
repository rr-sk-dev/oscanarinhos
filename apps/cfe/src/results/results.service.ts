import { computed, Injectable } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { Match } from '@canarinhos/shared-types';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ResultsService {
  private readonly baseUrl = environment.apiUrl;

  private readonly resultsResource = httpResource<Match[]>(
    () => `${this.baseUrl}/api/matches/results/${environment.team.slug}`,
    { defaultValue: [] },
  );

  private readonly upcomingResource = httpResource<Match[]>(
    () => `${this.baseUrl}/api/matches/upcoming/${environment.team.slug}`,
    { defaultValue: [] },
  );

  private readonly allByTeamResource = httpResource<Match[]>(
    () => `${this.baseUrl}/api/matches/by-team/${environment.team.slug}`,
    { defaultValue: [] },
  );

  // Combined timeline (finished + scheduled) sorted desc on the API side
  readonly all = this.allByTeamResource.value;
  readonly allLoading = this.allByTeamResource.isLoading;
  readonly allError = computed(() => {
    const err = this.allByTeamResource.error();
    return err ? 'Falha ao carregar jogos' : null;
  });

  // Results signals
  readonly results = this.resultsResource.value;
  readonly resultsLoading = this.resultsResource.isLoading;
  readonly resultsError = computed(() => {
    const err = this.resultsResource.error();
    return err ? 'Falha ao carregar resultados' : null;
  });

  // Upcoming signals
  readonly upcoming = this.upcomingResource.value;
  readonly upcomingLoading = this.upcomingResource.isLoading;
  readonly upcomingError = computed(() => {
    const err = this.upcomingResource.error();
    return err ? 'Falha ao carregar próximos jogos' : null;
  });
}
