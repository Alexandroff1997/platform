import { Injectable } from '@nestjs/common';
import { UserEntity } from './entities/user.entity';
import type { CreateUserInput } from './types/create-user.type';
import { UserRepository } from './user.repository';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async create(input: CreateUserInput): Promise<UserEntity> {
    return this.userRepository.create(input);
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    return this.userRepository.findByEmail(email);
  }

  async deleteByEmail(email: string): Promise<boolean> {
    return this.userRepository.deleteByEmail(email);
  }
}
