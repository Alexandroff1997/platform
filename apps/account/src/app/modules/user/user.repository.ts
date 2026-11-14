import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserRole } from '@platform/shared';
import { Repository } from 'typeorm';
import { UserEntity } from './entities/user.entity';
import type { CreateUserInput } from './types/create-user.type';

@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repository: Repository<UserEntity>,
  ) {}

  async create(input: CreateUserInput): Promise<UserEntity> {
    const user = this.repository.create({
      displayName: input.displayName,
      email: input.email,
      passwordHash: input.passwordHash,
      role: input.role ?? UserRole.Student,
    });

    return this.repository.save(user);
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    return this.repository.findOne({ where: { email } });
  }

  async deleteByEmail(email: string): Promise<boolean> {
    const result = await this.repository.delete({ email });
    return (result.affected ?? 0) > 0;
  }
}
