import { BaseRepository } from '../database';
import {
    CreatePlayerData,
    PlayerEntity,
    PlayerPosition,
    PlayerStatus,
    UpdatePlayerData,
} from './types/player.entity';

export type PlayerFilters = {
  teamId?: string;
  teamName?: string;
  position?: PlayerPosition;
  status?: PlayerStatus;
  name?: string;
};

export abstract class PlayerRepository extends BaseRepository<
  PlayerEntity,
  CreatePlayerData,
  UpdatePlayerData
> {
  abstract findAll(filters?: PlayerFilters): Promise<PlayerEntity[]>;
  abstract findById(id: string): Promise<PlayerEntity | null>;
  abstract findByShirtNumber(
    teamId: string,
    shirtNumber: number,
  ): Promise<PlayerEntity | null>;
}
