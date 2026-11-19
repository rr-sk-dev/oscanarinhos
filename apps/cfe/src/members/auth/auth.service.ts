import { HttpClient, httpResource } from '@angular/common/http';
import { computed, inject, Service, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { MeResponse } from '@canarinhos/shared-types';
import { environment } from '../../environments/environment';
import { valueOr } from '../../shared/resource-value';
import { TeamService } from '../../team/team.service';

const TOKEN_KEY = 'canarinhos.accessToken';

function readStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function writeStoredToken(token: string | null): void {
  try {
    if (token === null) {
      localStorage.removeItem(TOKEN_KEY);
    } else {
      localStorage.setItem(TOKEN_KEY, token);
    }
  } catch {
    // Storage is unavailable: the session lasts until the page is closed.
  }
}

@Service()
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly team = inject(TeamService);
  private readonly apiUrl = environment.apiUrl;

  private readonly token = signal(readStoredToken());

  private readonly meResource = httpResource<MeResponse>(() =>
    this.token() ? `${this.apiUrl}/api/me` : undefined,
  );

  readonly isSignedIn = computed(() => this.token() !== null);
  readonly me = valueOr(this.meResource, null);
  readonly activeMembership = computed(() => {
    const memberships = this.me()?.memberships ?? [];
    const teamId = this.team.id();
    return memberships.find((membership) => membership.teamId === teamId) ?? memberships[0] ?? null;
  });

  getToken(): string | null {
    return this.token();
  }

  async requestCode(email: string): Promise<void> {
    await firstValueFrom(this.http.post<void>(`${this.apiUrl}/api/auth/code`, { email }));
  }

  async verify(email: string, code: string): Promise<void> {
    const { accessToken } = await firstValueFrom(
      this.http.post<{ accessToken: string }>(`${this.apiUrl}/api/auth/verify`, { email, code }),
    );
    this.storeToken(accessToken);
  }

  reloadMe(): void {
    this.meResource.reload();
  }

  signOut(): void {
    this.storeToken(null);
  }

  storeToken(token: string | null): void {
    writeStoredToken(token);
    this.token.set(token);
  }
}
