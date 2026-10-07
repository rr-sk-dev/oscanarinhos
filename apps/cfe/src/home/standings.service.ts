import { Injectable } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { StandingContext } from '@canarinhos/shared-types';
import { environment } from '../environments/environment';
import { valueOr } from '../shared/resource-value';
import { APP_CONSTANTS } from '../shared/app.constants';

@Injectable({ providedIn: 'root' })
export class StandingsService {
  private readonly baseUrl = environment.apiUrl;
  private readonly teamName = environment.team.slug;

  private readonly resource = httpResource<StandingContext>(
    () => `${this.baseUrl}/api/standings/${APP_CONSTANTS.season.id}/context/${this.teamName}`,
  );

  readonly context = valueOr(this.resource, undefined);
  readonly loading = this.resource.isLoading;
}
