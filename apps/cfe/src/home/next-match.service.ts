import { computed, Injectable } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { Match } from '@canarinhos/shared-types';
import { environment } from '../environments/environment';
import { valueOr } from '../shared/resource-value';

@Injectable({ providedIn: 'root' })
export class NextMatchService {
  private readonly baseUrl = environment.apiUrl;

  private readonly resource = httpResource<Match>(
    () => `${this.baseUrl}/api/matches/next/${environment.team.slug}`,
  );

  readonly match = valueOr(this.resource, undefined);
  readonly loading = this.resource.isLoading;
  readonly error = computed(() =>
    this.resource.error() ? 'Falha ao carregar próximo jogo' : null,
  );
}
