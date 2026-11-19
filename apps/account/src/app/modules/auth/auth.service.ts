import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { AccountLogin, AccountRegister } from '@platform/contracts';
import { UserRole } from '@platform/shared';
import { compare, hash, hashSync } from 'bcryptjs';
import { QueryFailedError } from 'typeorm';
import { UserEntity } from '../user/entities/user.entity';
import { UserRepository } from '../user/user.repository';

const BCRYPT_ROUNDS = 12;
const DUMMY_HASH = hashSync('timing-equalizer', BCRYPT_ROUNDS);

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
  ) {}

  async register(
    dto: AccountRegister.Request,
  ): Promise<AccountRegister.Response> {
    this.validatePasswordLength(dto.password);
    const passwordHash = await hash(dto.password, BCRYPT_ROUNDS);

    try {
      const user = await this.userRepository.create({
        email: dto.email,
        displayName: dto.displayName ?? dto.email,
        passwordHash,
        role: dto.role ?? UserRole.Student,
      });
      return { email: user.email, message: 'User successfully created' };
    } catch (error: unknown) {
      if (
        error instanceof QueryFailedError &&
        error.driverError.code === '23505' &&
        error.driverError.constraint === 'users_email_unique'
      ) {
        throw new ConflictException('A user with this email already exists');
      }
      throw error;
    }
  }

  async login(email: string, password: string): Promise<AccountLogin.Response> {
    const user = await this.validateCredentials(email, password);
    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
    return { accessToken };
  }

  async validateCredentials(
    email: string,
    password: string,
  ): Promise<UserEntity> {
    this.validatePasswordLength(password);
    const user = await this.userRepository.findByEmail(email);
    const passwordHash = user === null ? DUMMY_HASH : user.passwordHash;
    const matches = await compare(password, passwordHash);
    if (user === null || !matches) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return user;
  }

  private validatePasswordLength(password: string): void {
    if (Buffer.byteLength(password, 'utf8') > 72) {
      throw new BadRequestException('Password must not exceed 72 UTF-8 bytes');
    }
  }
}
