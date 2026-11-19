import { Injectable } from '@nestjs/common';
import { InjectModel, ModelDelegate } from '../database';
import { AttendanceRepository } from './attendance.repository';
import { AttendanceEntry, AttendanceRecord } from './types/attendance.entity';

@Injectable()
export class PrismaAttendanceRepository extends AttendanceRepository {
  constructor(
    @InjectModel('attendance') private readonly attendanceModel: ModelDelegate<'attendance'>,
  ) {
    super();
  }

  async upsertMany(eventId: string, entries: AttendanceEntry[]): Promise<void> {
    await Promise.all(
      entries.map(({ membershipId, attended }) =>
        this.attendanceModel.upsert({
          where: { eventId_membershipId: { eventId, membershipId } },
          create: { eventId, membershipId, attended },
          update: { attended },
        }),
      ),
    );
  }

  async findByTeamBetween(teamId: string, from: Date, to: Date): Promise<AttendanceRecord[]> {
    const records = await this.attendanceModel.findMany({
      where: { event: { teamId, startsAt: { gte: from, lt: to } } },
      include: { event: { select: { type: true, status: true, startsAt: true } } },
    });
    return records.map((record) => ({
      eventId: record.eventId,
      membershipId: record.membershipId,
      attended: record.attended,
      eventType: record.event.type,
      eventStatus: record.event.status,
      eventStartsAt: record.event.startsAt,
    }));
  }
}
