import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { UserRole } from '@platform/shared';
import { isEmail } from 'class-validator';
import { Strategy } from 'passport-jwt';
import type { AuthUser } from './auth-user.interface';
import { createJwtStrategyOptions } from './jwt.config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(config: ConfigService) {
    super(createJwtStrategyOptions(config.get<string>('JWT_SECRET')));
  }

  validate(payload: unknown): AuthUser {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      throw new UnauthorizedException('Invalid token payload');
    }
    const { sub, email, role, exp } = payload as Record<string, unknown>;
    if (
      typeof sub !== 'string' ||
      !sub.trim() ||
      typeof email !== 'string' ||
      !isEmail(email) ||
      !Object.values(UserRole).includes(role as UserRole) ||
      typeof exp !== 'number' ||
      !Number.isFinite(exp)
    ) {
      throw new UnauthorizedException('Invalid token payload');
    }
    return { id: sub, email, role: role as UserRole };
  }
}
