import { CreateInviteData, InviteEntity } from './types/invite.entity';

export abstract class InviteRepository {
  abstract findByCode(code: string): Promise<InviteEntity | null>;
  abstract create(data: CreateInviteData): Promise<InviteEntity>;
  /** Atomically takes one use. Resolves false when the invite is expired or used up. */
  abstract consume(id: string, now: Date): Promise<boolean>;
  /** Gives back one use taken by `consume`. */
  abstract release(id: string): Promise<void>;
}
