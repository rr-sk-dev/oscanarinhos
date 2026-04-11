import { Injectable } from '@nestjs/common';
import { InjectModel, ModelDelegate } from '../database';
import { PlayerFilters, PlayerRepository } from './players.repository';
import {
  CreatePlayerData,
  PlayerEntity,
  UpdatePlayerData,
} from './types/player.entity';
import { PlayerMapper } from './types/player.mapper';

@Injectable()
export class PrismaPlayerRepository extends PlayerRepository {
  constructor(
    @InjectModel('player')
    private readonly playerModel: ModelDelegate<'player'>,
  ) {
    super();
  }

  async create(data: CreatePlayerData): Promise<PlayerEntity> {
    const record = await this.playerModel.create({ data });
    return PlayerMapper.toDomain(record);
  }

  async findAll(filters: PlayerFilters = {}): Promise<PlayerEntity[]> {
    const { teamId, teamName, position, status, name } = filters;

    const records = await this.playerModel.findMany({
      where: {
        ...(teamId && { teamId }),
        ...(teamName && {
          team: { name: { equals: teamName, mode: 'insensitive' } },
        }),
        ...(position && { position: PlayerMapper.toPositionPrisma(position) }),
        ...(status && { status: PlayerMapper.toStatusPrisma(status) }),
        ...(name && {
          OR: [
            { firstName: { contains: name, mode: 'insensitive' } },
            { lastName: { contains: name, mode: 'insensitive' } },
            { fullName: { contains: name, mode: 'insensitive' } },
            { nickname: { contains: name, mode: 'insensitive' } },
          ],
        }),
      },
      orderBy: [{ shirtNumber: 'asc' }, { lastName: 'asc' }],
    });

    return records.map(PlayerMapper.toDomain);
  }

  async findById(id: string): Promise<PlayerEntity | null> {
    const record = await this.playerModel.findUnique({
      where: { id },
    });
    return record ? PlayerMapper.toDomain(record) : null;
  }

  async findByShirtNumber(
    teamId: string,
    shirtNumber: number,
  ): Promise<PlayerEntity | null> {
    const record = await this.playerModel.findUnique({
      where: { teamId_shirtNumber: { teamId, shirtNumber } },
    });
    return record ? PlayerMapper.toDomain(record) : null;
  }

  async update(
    id: string,
    data: UpdatePlayerData,
  ): Promise<PlayerEntity> {
    const record = await this.playerModel.update({
      where: { id },
      data,
    });
    return PlayerMapper.toDomain(record);
  }

  async delete(id: string): Promise<void> {
    await this.playerModel.delete({ where: { id } });
  }

  async count(filters: PlayerFilters = {}): Promise<number> {
    const { teamId, position, status } = filters;

    return this.playerModel.count({
      where: {
        ...(teamId && { teamId }),
        ...(position && { position: PlayerMapper.toPositionPrisma(position) }),
        ...(status && { status: PlayerMapper.toStatusPrisma(status) }),
      },
    });
  }
}
