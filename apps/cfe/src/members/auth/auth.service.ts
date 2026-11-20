import { HttpClient, httpResource } from '@angular/common/http';
import { computed, inject, Service, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { MeResponse } from '@canarinhos/shared-types';
import { environment } from '../../environments/environment';
import { valueOr } from '../../shared/resource-value';
import { TeamService } from '../../team/team.service';
import { SignOutHooks } from './sign-out-hooks';

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
  private readonly signOutHooks = inject(SignOutHooks);
  private readonly apiUrl = environment.apiUrl;

  private readonly token = signal(readStoredToken());
  private pendingSignOut: Promise<void> | null = null;

  private readonly meResource = httpResource<MeResponse>(() =>
    this.token() ? `${this.apiUrl}/api/me` : undefined,
  );

  /** True while the first /me response is on its way, i.e. the role is not known yet. */
  readonly isMeLoading = this.meResource.isLoading;
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

  /** Fetches /me and stores it, resolving only once `me` holds the fresh value. */
  async reloadMe(): Promise<void> {
    const me = await firstValueFrom(this.http.get<MeResponse>(`${this.apiUrl}/api/me`));
    this.meResource.set(me);
  }

  /**
   * Runs the sign-out hooks (best effort, with the token still set), then clears the token.
   * A call while a sign-out is in progress joins it, so a 401 from a hook's own request
   * cannot start another round.
   */
  signOut(): Promise<void> {
    if (this.token() === null) {
      return Promise.resolve();
    }
    this.pendingSignOut ??= this.runSignOut().finally(() => {
      this.pendingSignOut = null;
    });
    return this.pendingSignOut;
  }

  private async runSignOut(): Promise<void> {
    await this.signOutHooks.runAll();
    this.storeToken(null);
  }

  storeToken(token: string | null): void {
    writeStoredToken(token);
    this.token.set(token);
  }
}
