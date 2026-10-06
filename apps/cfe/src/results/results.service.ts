import { computed, Injectable } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { Match } from '@canarinhos/shared-types';
import { environment } from '../environments/environment';
import { valueOr } from '../shared/resource-value';

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

  // Results signals
  readonly results = valueOr(this.resultsResource, []);
  readonly resultsLoading = this.resultsResource.isLoading;
  readonly resultsError = computed(() => {
    const err = this.resultsResource.error();
    return err ? 'Falha ao carregar resultados' : null;
  });

  // Upcoming signals
  readonly upcoming = valueOr(this.upcomingResource, []);
  readonly upcomingLoading = this.upcomingResource.isLoading;
  readonly upcomingError = computed(() => {
    const err = this.upcomingResource.error();
    return err ? 'Falha ao carregar próximos jogos' : null;
  });
}
