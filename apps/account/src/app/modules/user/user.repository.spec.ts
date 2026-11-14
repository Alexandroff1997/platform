import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserRole } from '@platform/shared';
import { hashSync } from 'bcryptjs';
import { QueryFailedError, Repository } from 'typeorm';
import { AuthService } from '../auth/auth.service';
import { UserEntity } from './entities/user.entity';
import { UserModule } from './user.module';
import { UserRepository } from './user.repository';
import { UserService } from './user.service';

describe('User persistence', () => {
  const input = {
    email: 'user@example.com',
    displayName: 'Test User',
    passwordHash: hashSync('correct-password', 4),
  };
  const user = Object.assign(new UserEntity(), {
    ...input,
    id: 'generated-id',
    role: UserRole.Student,
  });
  let service: UserService;
  let auth: AuthService;
  let database: {
    create: jest.Mock;
    save: jest.Mock;
    findOne: jest.Mock;
    delete: jest.Mock;
  };

  beforeEach(async () => {
    database = {
      create: jest.fn((data) => Object.assign(new UserEntity(), data)),
      save: jest.fn().mockResolvedValue(user),
      findOne: jest.fn().mockResolvedValue(user),
      delete: jest.fn().mockResolvedValue({ affected: 1 }),
    };
    const module = await Test.createTestingModule({
      imports: [UserModule],
      providers: [AuthService],
    })
      .overrideProvider(getRepositoryToken(UserEntity))
      .useValue(database as unknown as Repository<UserEntity>)
      .compile();
    service = module.get(UserService);
    auth = module.get(AuthService);
    expect(module.get(UserRepository)).toBeInstanceOf(UserRepository);
  });

  it('persists a new user with a default student role and generated id', async () => {
    expect(await service.create(input)).toEqual(user);
    const persisted = database.save.mock.calls[0][0];
    expect(persisted).toBeInstanceOf(UserEntity);
    expect(persisted).toMatchObject({ ...input, role: UserRole.Student });
    expect(persisted.id).toBeUndefined();
  });

  it('accepts an explicit role but excludes an incoming id', async () => {
    await service.create({
      ...input,
      role: UserRole.Teacher,
      id: 'unsafe-id',
    } as typeof input);
    expect(database.save.mock.calls[0][0].id).toBeUndefined();
    expect(database.save.mock.calls[0][0].role).toBe(UserRole.Teacher);
  });

  it('propagates a duplicate email error without overwriting the existing user', async () => {
    const error = new QueryFailedError(
      'INSERT',
      [],
      Object.assign(new Error('duplicate key'), { code: '23505' }),
    );
    database.save.mockRejectedValue(error);
    await expect(service.create(input)).rejects.toBe(error);
  });

  it('finds the requested email including credentials for authentication', async () => {
    expect(await service.findByEmail(input.email)).toEqual(user);
    expect(database.findOne).toHaveBeenCalledWith({
      where: { email: input.email },
    });
  });

  it('returns null when the email is absent', async () => {
    database.findOne.mockResolvedValue(null);
    await expect(service.findByEmail('absent@example.com')).resolves.toBeNull();
  });

  it('deletes by email and reports whether a user was removed', async () => {
    await expect(service.deleteByEmail(input.email)).resolves.toBe(true);
    expect(database.delete).toHaveBeenCalledWith({ email: input.email });
    database.delete.mockResolvedValue({ affected: 0 });
    await expect(service.deleteByEmail(input.email)).resolves.toBe(false);
  });

  it('authenticates with credentials retrieved through the user module', async () => {
    await expect(
      auth.validateCredentials(input.email, 'correct-password'),
    ).resolves.toEqual({ valid: true });
  });

  it('rejects an incorrect password and an unknown user', async () => {
    await expect(
      auth.validateCredentials(input.email, 'wrong-password'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    database.findOne.mockResolvedValue(null);
    await expect(
      auth.validateCredentials(input.email, 'correct-password'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects passwords exceeding the bcrypt byte limit before querying', async () => {
    await expect(
      auth.validateCredentials(input.email, 'a'.repeat(73)),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(database.findOne).not.toHaveBeenCalled();
  });

  it('propagates database failures instead of reporting absence', async () => {
    const error = new Error('Database unavailable');
    database.findOne.mockRejectedValue(error);
    database.delete.mockRejectedValue(error);
    await expect(service.findByEmail(input.email)).rejects.toBe(error);
    await expect(service.deleteByEmail(input.email)).rejects.toBe(error);
  });
});
