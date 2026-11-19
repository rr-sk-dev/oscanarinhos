export interface LoginCodeEntity {
  id: string;
  email: string;
  codeHash: string;
  expiresAt: Date;
  attempts: number;
  consumedAt: Date | null;
  createdAt: Date;
}

export interface CreateLoginCodeData {
  email: string;
  codeHash: string;
  expiresAt: Date;
}

export abstract class LoginCodeRepository {
  abstract create(data: CreateLoginCodeData): Promise<void>;
  abstract findLatestByEmail(email: string): Promise<LoginCodeEntity | null>;
  /** How many codes were created for the email at or after `since`. */
  abstract countCreatedSince(email: string, since: Date): Promise<number>;
  /** Atomically increments the attempt counter and returns the new value. */
  abstract incrementAttempts(id: string): Promise<number>;
  /** Marks the code consumed; resolves false if it was already consumed. */
  abstract consume(id: string): Promise<boolean>;
}
