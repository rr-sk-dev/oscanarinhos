import { computed, Injectable } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { Player } from '@canarinhos/shared-types';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SquadService {
  private readonly baseUrl = environment.apiUrl;

  private readonly playersResource = httpResource<Player[]>(
    () => ({
      url: `${this.baseUrl}/api/players`,
      params: { teamName: environment.team.slug },
    }),
    { defaultValue: [] },
  );

  readonly players = this.playersResource.value;
  readonly loading = this.playersResource.isLoading;
  readonly error = computed(() => {
    const err = this.playersResource.error();
    return err ? 'Falha ao carregar plantel' : null;
  });
  readonly teamId = computed(() => {
    const players = this.playersResource.value();
    return players.length > 0 ? players[0].teamId : null;
  });

  getPlayer(id: string): Player | undefined {
    return this.players().find((p) => p.id === id);
  }
}
