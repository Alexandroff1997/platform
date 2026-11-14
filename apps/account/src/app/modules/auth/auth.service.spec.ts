import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@platform/shared';
import { compare, hashSync } from 'bcryptjs';
import { QueryFailedError } from 'typeorm';
import { UserEntity } from '../user/entities/user.entity';
import { UserService } from '../user/user.service';
import { AuthService } from './auth.service';

const secret = 'test-only-secret-with-at-least-32-bytes';

describe('AuthService', () => {
  const user = Object.assign(new UserEntity(), {
    id: 'user-id',
    email: 'user@example.com',
    displayName: 'User',
    role: UserRole.Student,
    passwordHash: hashSync('correct-password', 4),
  });
  let users: { create: jest.Mock; findByEmail: jest.Mock };
  let auth: AuthService;
  const jwt = new JwtService({
    secret,
    signOptions: { expiresIn: '1h', algorithm: 'HS256' },
  });

  beforeEach(() => {
    users = {
      create: jest.fn().mockResolvedValue(user),
      findByEmail: jest.fn().mockResolvedValue(user),
    };
    auth = new AuthService(users as unknown as UserService, jwt);
  });

  it('registers with a salted bcrypt hash and safe response', async () => {
    const dto = { email: user.email, password: 'new-password' };
    await expect(auth.register(dto)).resolves.toEqual({
      email: user.email,
      message: 'User successfully created',
    });
    const input = users.create.mock.calls[0][0];
    expect(input).toMatchObject({
      email: user.email,
      displayName: user.email,
      role: UserRole.Student,
    });
    expect(input.passwordHash).not.toBe(dto.password);
    expect(await compare(dto.password, input.passwordHash)).toBe(true);
    expect(input.passwordHash).toMatch(/^\$2[aby]\$12\$/);
    expect(input.password).toBeUndefined();
  });

  it('preserves an explicit display name and teacher role', async () => {
    await auth.register({
      email: user.email,
      password: 'password',
      displayName: 'Teacher',
      role: UserRole.Teacher,
    });
    expect(users.create.mock.calls[0][0]).toMatchObject({
      displayName: 'Teacher',
      role: UserRole.Teacher,
    });
  });

  it('translates concurrent duplicate-email inserts to 409', async () => {
    users.create.mockRejectedValue(
      new QueryFailedError(
        'INSERT',
        [],
        Object.assign(new Error('duplicate'), {
          code: '23505',
          constraint: 'users_email_unique',
        }),
      ),
    );
    await expect(
      auth.register({ email: user.email, password: 'password' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('propagates unexpected database failures', async () => {
    const error = new Error('Database unavailable');
    users.create.mockRejectedValue(error);
    await expect(
      auth.register({ email: user.email, password: 'password' }),
    ).rejects.toBe(error);
  });

  it('rejects multibyte passwords above 72 bytes before hashing or saving', async () => {
    await expect(
      auth.register({ email: user.email, password: 'я'.repeat(37) }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(users.create).not.toHaveBeenCalled();
  });

  it('returns a signed JWT with identity, role and one-hour expiration', async () => {
    const result = await auth.login(user.email, 'correct-password');
    expect(Object.keys(result)).toEqual(['accessToken']);
    const payload = jwt.verify(result.accessToken, { algorithms: ['HS256'] });
    expect(payload).toMatchObject({
      sub: user.id,
      email: user.email,
      role: UserRole.Student,
    });
    expect(payload.exp - payload.iat).toBe(3600);
    expect(payload.passwordHash).toBeUndefined();
    expect(() =>
      new JwtService({ secret: 'wrong-secret' }).verify(result.accessToken),
    ).toThrow();
    expect(() =>
      jwt.verify(result.accessToken, { clockTimestamp: payload.exp + 1 }),
    ).toThrow();
  });

  it('rejects wrong passwords and absent users without issuing tokens', async () => {
    await expect(auth.login(user.email, 'wrong')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    users.findByEmail.mockResolvedValue(null);
    await expect(
      auth.login(user.email, 'correct-password'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
