import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database';
import { PrismaStandingsRepository } from './standings-prisma.repository';
import { StandingsController } from './standings.controller';
import { StandingsRepository } from './standings.repository';
import { StandingsService } from './standings.service';

@Module({
  imports: [DatabaseModule.forFeature('standing')],
  controllers: [StandingsController],
  providers: [
    {
      provide: StandingsRepository,
      useClass: PrismaStandingsRepository,
    },
    StandingsService,
  ],
  exports: [StandingsRepository, StandingsService],
})
export class StandingsModule {}
