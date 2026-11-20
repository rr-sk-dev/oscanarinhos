import { Service } from '@angular/core';

export type SignOutHook = () => Promise<void>;

/**
 * Work that must run while the session token is still valid, just before sign-out clears it.
 * Lets other services (e.g. push) clean up without AuthService depending on them.
 */
@Service()
export class SignOutHooks {
  private readonly hooks: SignOutHook[] = [];

  add(hook: SignOutHook): void {
    this.hooks.push(hook);
  }

  /** Runs every hook; a failing hook never fails the sign-out. */
  async runAll(): Promise<void> {
    await Promise.allSettled(this.hooks.map((hook) => Promise.resolve().then(hook)));
  }
}
