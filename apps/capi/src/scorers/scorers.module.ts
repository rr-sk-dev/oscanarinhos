import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database';
import { PrismaScorersRepository } from './scorers-prisma.repository';
import { ScorersController } from './scorers.controller';
import { ScorersRepository } from './scorers.repository';
import { ScorersService } from './scorers.service';

@Module({
  imports: [DatabaseModule.forFeature('scorer')],
  controllers: [ScorersController],
  providers: [
    {
      provide: ScorersRepository,
      useClass: PrismaScorersRepository,
    },
    ScorersService,
  ],
  exports: [ScorersRepository, ScorersService],
})
export class ScorersModule {}
