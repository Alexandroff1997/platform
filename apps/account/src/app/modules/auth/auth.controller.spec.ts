import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { UserRole } from '@platform/shared';
import { QueryFailedError } from 'typeorm';
import { UserEntity } from '../user/entities/user.entity';
import { UserService } from '../user/user.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('Auth HTTP', () => {
  let app: INestApplication;
  let baseUrl: string;
  const users = new Map<string, UserEntity>();
  const email = 'http@example.com';
  const password = 'HttpPassword123!';

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [
        JwtModule.register({
          secret: 'http-test-secret-at-least-32-bytes',
          signOptions: { expiresIn: '1h', algorithm: 'HS256' },
        }),
      ],
      controllers: [AuthController],
      providers: [
        AuthService,
        {
          provide: UserService,
          useValue: {
            create: jest.fn(async (input) => {
              if (users.has(input.email)) {
                throw new QueryFailedError(
                  'INSERT',
                  [],
                  Object.assign(new Error('duplicate'), {
                    code: '23505',
                    constraint: 'users_email_unique',
                  }),
                );
              }
              const user = Object.assign(new UserEntity(), input, {
                id: 'test-user-id',
              });
              users.set(input.email, user);
              return user;
            }),
            findByEmail: jest.fn(
              async (value: string) => users.get(value) ?? null,
            ),
          },
        },
      ],
    }).compile();
    app = module.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.listen(0, '127.0.0.1');
    baseUrl = await app.getUrl();
  });
  afterAll(async () => {
    await app?.close();
  });

  async function post(path: string, body: unknown) {
    return fetch(`${baseUrl}/api/auth/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  it('registers then logs in over HTTP with a verifiable JWT', async () => {
    const registered = await post('register', { email, password });
    expect(registered.status).toBe(201);
    expect(await registered.json()).toEqual({
      email,
      message: 'User successfully created',
    });
    const loggedIn = await post('login', { email, password });
    expect(loggedIn.status).toBe(200);
    const body = await loggedIn.json();
    expect(app.get(JwtService).verify(body.accessToken)).toMatchObject({
      sub: 'test-user-id',
      email,
      role: UserRole.Student,
    });
  });

  it('returns 409 for a duplicate email without replacing credentials', async () => {
    const response = await post('register', {
      email,
      password: 'different-password',
    });
    expect(response.status).toBe(409);
    expect((await post('login', { email, password })).status).toBe(200);
  });

  it.each([
    { email: 'invalid', password },
    { email, password: '' },
    { email, password: 'я'.repeat(37) },
    { email, password, role: 'Admin' },
    { email, password, role: null },
    { email, password, displayName: null },
    { email, password, displayName: '' },
    { email, password, passwordHash: 'unsafe' },
  ])('rejects invalid registration input %j', async (body) => {
    expect((await post('register', body)).status).toBe(400);
  });

  it.each([
    { email: 'invalid', password },
    { email, password: '' },
    { email, password, extra: true },
    { email, password: 'a'.repeat(73) },
  ])('rejects invalid login input %j', async (body) => {
    expect((await post('login', body)).status).toBe(400);
  });

  it('returns the same 401 for wrong password and unknown email', async () => {
    for (const body of [
      { email, password: 'wrong' },
      { email: 'absent@example.com', password },
    ]) {
      const result = await post('login', body);
      expect(result.status).toBe(401);
      expect(await result.json()).toMatchObject({
        message: 'Invalid credentials',
      });
    }
  });
});
