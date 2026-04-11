import { computed, Injectable } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { StandingContext } from '@canarinhos/shared-types';
import { environment } from '../environments/environment';

const SEASON = '2025-26';

@Injectable({ providedIn: 'root' })
export class StandingsService {
  private readonly baseUrl = environment.apiUrl;
  private readonly teamName = environment.team.slug;

  private readonly resource = httpResource<StandingContext>(
    () => `${this.baseUrl}/api/standings/${SEASON}/context/${this.teamName}`,
  );

  readonly context = this.resource.value;
  readonly loading = this.resource.isLoading;
  readonly error = computed(() =>
    this.resource.error() ? 'Falha ao carregar classificação' : null,
  );
}
