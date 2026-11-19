import { createHash } from 'crypto';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { LoginCodeEntity, LoginCodeRepository } from './login-code.repository';
import { EmailSender } from './email/email-sender';
import { InvalidLoginCodeException } from './exceptions/auth.exceptions';
import { UserRepository } from '../users/user.repository';
import { UserEntity } from '../users/types/user.entity';

const hashOf = (email: string, code: string) =>
  createHash('sha256').update(`${email}:${code}`).digest('hex');

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: jest.Mocked<UserRepository>;
  let loginCodeRepository: jest.Mocked<LoginCodeRepository>;
  let emailSender: jest.Mocked<EmailSender>;
  let jwtService: jest.Mocked<JwtService>;

  const email = 'player@example.com';
  const user: UserEntity = {
    id: 'user-uuid',
    email,
    name: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const storedCode = (overrides: Partial<LoginCodeEntity> = {}): LoginCodeEntity => ({
    id: 'code-uuid',
    email,
    codeHash: hashOf(email, '123456'),
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    attempts: 0,
    consumedAt: null,
    createdAt: new Date(),
    ...overrides,
  });

  beforeEach(() => {
    userRepository = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
    } as unknown as jest.Mocked<UserRepository>;

    loginCodeRepository = {
      create: jest.fn().mockResolvedValue(undefined),
      findLatestByEmail: jest.fn().mockResolvedValue(null),
      countCreatedSince: jest.fn().mockResolvedValue(0),
      incrementAttempts: jest.fn(),
      consume: jest.fn().mockResolvedValue(true),
    } as unknown as jest.Mocked<LoginCodeRepository>;

    emailSender = { send: jest.fn().mockResolvedValue(undefined) } as jest.Mocked<EmailSender>;
    jwtService = {
      signAsync: jest.fn().mockResolvedValue('signed-token'),
    } as unknown as jest.Mocked<JwtService>;

    service = new AuthService(userRepository, loginCodeRepository, emailSender, jwtService);
  });

  describe('requestCode', () => {
    it('stores a hashed 6-digit code that expires in 10 minutes and sends one email', async () => {
      const before = Date.now();

      await service.requestCode(email);

      expect(loginCodeRepository.create).toHaveBeenCalledTimes(1);
      const stored = loginCodeRepository.create.mock.calls[0][0];
      expect(stored.email).toBe(email);
      expect(stored.codeHash).toMatch(/^[0-9a-f]{64}$/);
      const elapsed = stored.expiresAt.getTime() - before;
      expect(elapsed).toBeGreaterThanOrEqual(10 * 60 * 1000);
      expect(elapsed).toBeLessThan(10 * 60 * 1000 + 5000);

      expect(emailSender.send).toHaveBeenCalledTimes(1);
      const [to, , body] = emailSender.send.mock.calls[0];
      expect(to).toBe(email);
      const sentCode = body.match(/\b\d{6}\b/)?.[0];
      expect(sentCode).toBeDefined();
      expect(stored.codeHash).toBe(hashOf(email, sentCode as string));
      expect(stored.codeHash).not.toContain(sentCode as string);
    });

    it('trims and lowercases the email', async () => {
      await service.requestCode('  Player@Example.COM ');

      expect(loginCodeRepository.create.mock.calls[0][0].email).toBe(email);
      expect(emailSender.send.mock.calls[0][0]).toBe(email);
    });

    it('does the same work for known and unknown emails', async () => {
      userRepository.findByEmail.mockResolvedValue(user);
      await expect(service.requestCode(email)).resolves.toBeUndefined();

      userRepository.findByEmail.mockResolvedValue(null);
      await expect(service.requestCode('stranger@example.com')).resolves.toBeUndefined();

      expect(loginCodeRepository.create).toHaveBeenCalledTimes(2);
      expect(emailSender.send).toHaveBeenCalledTimes(2);
      expect(userRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('requestCode throttling', () => {
    it('sends nothing when the latest code is under a minute old', async () => {
      loginCodeRepository.findLatestByEmail.mockResolvedValue(
        storedCode({ createdAt: new Date(Date.now() - 30_000) }),
      );

      await expect(service.requestCode(email)).resolves.toBeUndefined();

      expect(loginCodeRepository.create).not.toHaveBeenCalled();
      expect(emailSender.send).not.toHaveBeenCalled();
    });

    it('sends again once the latest code is over a minute old', async () => {
      loginCodeRepository.findLatestByEmail.mockResolvedValue(
        storedCode({ createdAt: new Date(Date.now() - 61_000) }),
      );

      await service.requestCode(email);

      expect(emailSender.send).toHaveBeenCalledTimes(1);
    });

    it('sends nothing after 5 codes in the last hour', async () => {
      loginCodeRepository.countCreatedSince.mockResolvedValue(5);

      await expect(service.requestCode(email)).resolves.toBeUndefined();

      expect(loginCodeRepository.countCreatedSince).toHaveBeenCalledWith(email, expect.any(Date));
      const since = loginCodeRepository.countCreatedSince.mock.calls[0][1];
      expect(Date.now() - since.getTime()).toBeGreaterThanOrEqual(60 * 60 * 1000 - 1000);
      expect(loginCodeRepository.create).not.toHaveBeenCalled();
      expect(emailSender.send).not.toHaveBeenCalled();
    });

    it('still sends the 5th code (4 in the last hour)', async () => {
      loginCodeRepository.countCreatedSince.mockResolvedValue(4);

      await service.requestCode(email);

      expect(emailSender.send).toHaveBeenCalledTimes(1);
    });

    it('sends for an email that has never requested a code', async () => {
      loginCodeRepository.findLatestByEmail.mockResolvedValue(null);
      loginCodeRepository.countCreatedSince.mockResolvedValue(0);

      await service.requestCode('stranger@example.com');

      expect(emailSender.send).toHaveBeenCalledTimes(1);
    });
  });

  describe('verifyCode', () => {
    beforeEach(() => {
      loginCodeRepository.findLatestByEmail.mockResolvedValue(storedCode());
      loginCodeRepository.incrementAttempts.mockResolvedValue(1);
      userRepository.findByEmail.mockResolvedValue(user);
    });

    it('returns a token for a correct unexpired code and marks it consumed', async () => {
      const result = await service.verifyCode(email, '123456');

      expect(result).toEqual({ accessToken: 'signed-token' });
      expect(loginCodeRepository.consume).toHaveBeenCalledWith('code-uuid');
      expect(jwtService.signAsync).toHaveBeenCalledWith({ sub: 'user-uuid' });
    });

    it('normalises the email before looking the code up', async () => {
      await service.verifyCode(' Player@Example.com ', '123456');

      expect(loginCodeRepository.findLatestByEmail).toHaveBeenCalledWith(email);
    });

    it('rejects a wrong code without consuming it', async () => {
      await expect(service.verifyCode(email, '000000')).rejects.toThrow(InvalidLoginCodeException);

      expect(loginCodeRepository.consume).not.toHaveBeenCalled();
      expect(jwtService.signAsync).not.toHaveBeenCalled();
    });

    it('rejects when there is no code for the email', async () => {
      loginCodeRepository.findLatestByEmail.mockResolvedValue(null);

      await expect(service.verifyCode(email, '123456')).rejects.toThrow(InvalidLoginCodeException);
    });

    it('rejects an expired code', async () => {
      loginCodeRepository.findLatestByEmail.mockResolvedValue(
        storedCode({ expiresAt: new Date(Date.now() - 1000) }),
      );

      await expect(service.verifyCode(email, '123456')).rejects.toThrow(InvalidLoginCodeException);
    });

    it('rejects an already consumed code', async () => {
      loginCodeRepository.findLatestByEmail.mockResolvedValue(
        storedCode({ consumedAt: new Date() }),
      );

      await expect(service.verifyCode(email, '123456')).rejects.toThrow(InvalidLoginCodeException);
    });

    it('rejects when the code was consumed concurrently', async () => {
      loginCodeRepository.consume.mockResolvedValue(false);

      await expect(service.verifyCode(email, '123456')).rejects.toThrow(InvalidLoginCodeException);
      expect(jwtService.signAsync).not.toHaveBeenCalled();
    });

    it('kills the code after 5 wrong attempts even if the right digits follow', async () => {
      let attempts = 0;
      loginCodeRepository.incrementAttempts.mockImplementation(() => Promise.resolve(++attempts));

      for (let i = 0; i < 5; i++) {
        await expect(service.verifyCode(email, '000000')).rejects.toThrow(
          InvalidLoginCodeException,
        );
      }
      await expect(service.verifyCode(email, '123456')).rejects.toThrow(InvalidLoginCodeException);

      expect(loginCodeRepository.consume).not.toHaveBeenCalled();
    });

    it('creates the user on first successful sign-in', async () => {
      userRepository.findByEmail.mockResolvedValue(null);
      userRepository.create.mockResolvedValue(user);

      await service.verifyCode(email, '123456');

      expect(userRepository.create).toHaveBeenCalledWith({ email });
      expect(jwtService.signAsync).toHaveBeenCalledWith({ sub: 'user-uuid' });
    });

    it('reuses the existing user on later sign-ins', async () => {
      await service.verifyCode(email, '123456');

      expect(userRepository.create).not.toHaveBeenCalled();
    });
  });
});
