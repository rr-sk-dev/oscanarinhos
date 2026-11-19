import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database';
import { PrismaAvailabilityRepository } from './availability-prisma.repository';
import { AvailabilityRepository } from './availability.repository';
import { Clock, SystemClock } from './clock';

// Split from AvailabilityModule so EventsModule can read answers without a module cycle
// (AvailabilityModule itself depends on EventsModule for the event lookup).
@Module({
  imports: [DatabaseModule.forFeature('availability')],
  providers: [
    { provide: AvailabilityRepository, useClass: PrismaAvailabilityRepository },
    { provide: Clock, useClass: SystemClock },
  ],
  exports: [AvailabilityRepository, Clock],
})
export class AvailabilityDataModule {}
