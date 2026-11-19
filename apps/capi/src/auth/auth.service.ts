import { createHash, randomInt, timingSafeEqual } from 'crypto';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRepository } from '../users/user.repository';
import { EmailSender } from './email/email-sender';
import { InvalidLoginCodeException } from './exceptions/auth.exceptions';
import { LoginCodeRepository } from './login-code.repository';

const CODE_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const CODE_UPPER_BOUND = 1_000_000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const CODE_WINDOW_MS = 60 * 60 * 1000;
const MAX_CODES_PER_WINDOW = 5;

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly loginCodeRepository: LoginCodeRepository,
    private readonly emailSender: EmailSender,
    private readonly jwtService: JwtService,
  ) {}

  async requestCode(rawEmail: string): Promise<void> {
    const email = this.normalizeEmail(rawEmail);
    // Over the limit we resolve exactly like a sent code, so the response reveals nothing.
    if (await this.isRequestThrottled(email)) {
      return;
    }
    const code = randomInt(CODE_UPPER_BOUND).toString().padStart(6, '0');

    await this.loginCodeRepository.create({
      email,
      codeHash: this.hashCode(email, code),
      expiresAt: new Date(Date.now() + CODE_TTL_MS),
    });

    await this.emailSender.send(
      email,
      'O seu código de acesso aos Canarinhos',
      `O seu código de acesso é ${code}. Expira em 10 minutos.`,
    );
  }

  async verifyCode(rawEmail: string, code: string): Promise<{ accessToken: string }> {
    const email = this.normalizeEmail(rawEmail);
    const loginCode = await this.loginCodeRepository.findLatestByEmail(email);

    if (!loginCode || loginCode.consumedAt || loginCode.expiresAt.getTime() <= Date.now()) {
      throw new InvalidLoginCodeException();
    }

    const attempts = await this.loginCodeRepository.incrementAttempts(loginCode.id);
    if (attempts > MAX_ATTEMPTS || !this.matches(loginCode.codeHash, email, code)) {
      throw new InvalidLoginCodeException();
    }

    const wasConsumed = await this.loginCodeRepository.consume(loginCode.id);
    if (!wasConsumed) {
      throw new InvalidLoginCodeException();
    }

    const user =
      (await this.userRepository.findByEmail(email)) ??
      (await this.userRepository.create({ email }));

    return { accessToken: await this.jwtService.signAsync({ sub: user.id }) };
  }

  private async isRequestThrottled(email: string): Promise<boolean> {
    const latest = await this.loginCodeRepository.findLatestByEmail(email);
    if (latest && Date.now() - latest.createdAt.getTime() < RESEND_COOLDOWN_MS) {
      return true;
    }
    const recentCount = await this.loginCodeRepository.countCreatedSince(
      email,
      new Date(Date.now() - CODE_WINDOW_MS),
    );
    return recentCount >= MAX_CODES_PER_WINDOW;
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private hashCode(email: string, code: string): string {
    return createHash('sha256').update(`${email}:${code}`).digest('hex');
  }

  private matches(expectedHash: string, email: string, code: string): boolean {
    const expected = Buffer.from(expectedHash, 'hex');
    const actual = Buffer.from(this.hashCode(email, code), 'hex');
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  }
}
