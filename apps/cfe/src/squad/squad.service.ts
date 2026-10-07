import { computed, Service } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { Player } from '@canarinhos/shared-types';
import { environment } from '../environments/environment';
import { reloadOnResume } from '../shared/data-refresh';
import { valueOr } from '../shared/resource-value';

@Service()
export class SquadService {
  private readonly baseUrl = environment.apiUrl;

  private readonly playersResource = httpResource<Player[]>(
    () => ({
      url: `${this.baseUrl}/api/players`,
      params: { teamName: environment.team.slug },
    }),
    { defaultValue: [] },
  );

  readonly players = valueOr(this.playersResource, []);
  readonly loading = this.playersResource.isLoading;
  readonly error = computed(() => {
    const err = this.playersResource.error();
    return err ? 'Falha ao carregar plantel' : null;
  });

  getPlayer(id: string): Player | undefined {
    return this.players().find((p) => p.id === id);
  }

  constructor() {
    reloadOnResume(this.playersResource);
  }

  reload(): void {
    this.playersResource.reload();
  }
}
