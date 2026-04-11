import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database';
import { PrismaPlayerRepository } from './players-prisma.repository';
import { PlayersController } from './players.controller';
import { PlayerRepository } from './players.repository';
import { PlayersService } from './players.service';

@Module({
  imports: [DatabaseModule.forFeature('player')],
  controllers: [PlayersController],
  providers: [
    {
      provide: PlayerRepository,
      useClass: PrismaPlayerRepository,
    },
    PlayersService,
  ],
  exports: [PlayerRepository],
})
export class PlayersModule {}
