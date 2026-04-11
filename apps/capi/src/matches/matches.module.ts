import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database';
import { TeamsModule } from '../teams/teams.module';
import { PrismaMatchRepository } from './matches-prisma.repository';
import { MatchesController } from './matches.controller';
import { MatchRepository } from './matches.repository';
import { MatchesService } from './matches.service';

@Module({
  imports: [DatabaseModule.forFeature('match'), TeamsModule],
  controllers: [MatchesController],
  providers: [
    {
      provide: MatchRepository,
      useClass: PrismaMatchRepository,
    },
    MatchesService,
  ],
  exports: [MatchRepository],
})
export class MatchesModule {}
