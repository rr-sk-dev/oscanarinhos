import { Controller, Get, Logger, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

const DB_CHECK_TIMEOUT_MS = 2000;

@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async check(): Promise<{ status: 'ok' }> {
    try {
      await this.withTimeout(this.prisma.$queryRaw`SELECT 1`, DB_CHECK_TIMEOUT_MS);
    } catch (error) {
      // Details stay in the logs; the response body never exposes them.
      const { message, code } = (error ?? {}) as NodeJS.ErrnoException;
      this.logger.warn(`Database health check failed: ${message || code || String(error)}`);
      throw new ServiceUnavailableException({ status: 'error' });
    }

    return { status: 'ok' };
  }

  private async withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    let timer: NodeJS.Timeout;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error(`timed out after ${ms}ms`)), ms);
    });

    try {
      return await Promise.race([promise, timeout]);
    } finally {
      clearTimeout(timer);
    }
  }
}
