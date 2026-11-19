import { CreateUserData, UserEntity } from './types/user.entity';

export abstract class UserRepository {
  abstract findByEmail(email: string): Promise<UserEntity | null>;
  abstract findById(id: string): Promise<UserEntity | null>;
  abstract create(data: CreateUserData): Promise<UserEntity>;
}
