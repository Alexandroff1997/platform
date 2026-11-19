import { AmqpConnection, RpcTimeoutError } from '@golevelup/nestjs-rabbitmq';
import { type INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { JwtAuthModule } from '@platform/auth';
import {
  AccountLogin,
  AccountMessaging,
  AccountRegister,
} from '@platform/contracts';
import { UserRole } from '@platform/shared';
import { configureHttpApp } from '../../http.config';
import { AuthController } from './auth.controller';
import { AccountAuthRmqClient } from './account-auth-rmq.client';

describe('Auth HTTP gateway', () => {
  const secret = 'gateway-test-secret-at-least-32-bytes';
  const credentials = { email: 'user@example.com', password: 'password' };
  const claims = {
    sub: 'user-id',
    email: credentials.email,
    role: UserRole.Student,
  };
  const connection = { connected: true, request: jest.fn() };
  const jwt = new JwtService({
    secret,
    signOptions: { algorithm: 'HS256', expiresIn: 3600 },
  });
  let app: INestApplication;
  let baseUrl: string;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          ignoreEnvFile: true,
          load: [() => ({ JWT_SECRET: secret })],
        }),
        JwtAuthModule,
      ],
      controllers: [AuthController],
      providers: [
        AccountAuthRmqClient,
        { provide: AmqpConnection, useValue: connection },
      ],
    }).compile();
    app = module.createNestApplication();
    configureHttpApp(app);
    await app.listen(0, '127.0.0.1');
    baseUrl = await app.getUrl();
  });

  afterAll(async () => {
    await app?.close();
  });
  beforeEach(() => {
    connection.connected = true;
    connection.request.mockReset();
  });

  async function post(path: string, body: unknown) {
    return fetch(`${baseUrl}/api/auth/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  it('proxies registration using the shared RPC contract', async () => {
    const response = {
      email: credentials.email,
      message: 'User successfully created',
    };
    connection.request.mockResolvedValue(response);
    const body = {
      ...credentials,
      displayName: 'User',
      role: UserRole.Teacher,
    };
    const result = await post('register', body);
    expect(result.status).toBe(201);
    expect(await result.json()).toEqual(response);
    expect(connection.request).toHaveBeenCalledWith({
      exchange: AccountMessaging.exchange,
      routingKey: AccountRegister.topic,
      payload: body,
      timeout: 10000,
    });
  });

  it('maps the RPC accessToken to access_token on login', async () => {
    const accessToken = jwt.sign(claims);
    connection.request.mockResolvedValue({ accessToken });
    const result = await post('login', credentials);
    expect(result.status).toBe(200);
    expect(await result.json()).toEqual({ access_token: accessToken });
    expect(connection.request).toHaveBeenCalledWith({
      exchange: AccountMessaging.exchange,
      routingKey: AccountLogin.topic,
      payload: credentials,
      timeout: 10000,
    });
  });

  it.each([
    ['login', {}],
    ['login', { ...credentials, email: 'invalid' }],
    ['login', { ...credentials, password: '' }],
    ['login', { ...credentials, password: 'я'.repeat(37) }],
    ['login', { ...credentials, unexpected: true }],
    ['login', []],
    ['login', null],
    ['register', { ...credentials, role: 'Admin' }],
    ['register', { ...credentials, displayName: null }],
    ['register', { ...credentials, displayName: '  ' }],
  ])('rejects invalid %s input before RPC: %j', async (path, body) => {
    const result = await post(path as string, body);
    expect(result.status).toBe(400);
    expect(connection.request).not.toHaveBeenCalled();
  });

  it.each([400, 401, 409])(
    'maps an account error to HTTP %i',
    async (statusCode) => {
      const message =
        statusCode === 400 ? ['Invalid input'] : 'Request rejected';
      connection.request.mockResolvedValue({ error: { statusCode, message } });
      const result = await post('login', credentials);
      expect(result.status).toBe(statusCode);
      expect(await result.json()).toMatchObject({ statusCode, message });
    },
  );

  it('sanitizes account internal errors', async () => {
    connection.request.mockResolvedValue({
      error: { statusCode: 500, message: 'private database details' },
    });
    const result = await post('login', credentials);
    expect(result.status).toBe(500);
    expect(await result.json()).toMatchObject({
      message: 'Internal server error',
    });
  });

  it('does not expose extra fields from an RPC error', async () => {
    connection.request.mockResolvedValue({
      error: {
        statusCode: 401,
        message: 'Invalid credentials',
        passwordHash: 'private password hash',
        stack: 'private stack trace',
      },
    });
    const result = await post('login', credentials);
    expect(result.status).toBe(401);
    expect(await result.json()).toEqual({
      statusCode: 401,
      message: 'Invalid credentials',
    });
  });

  it('returns 504 when account does not respond in time', async () => {
    connection.request.mockRejectedValue(
      new RpcTimeoutError(10000, AccountMessaging.exchange, AccountLogin.topic),
    );
    expect((await post('login', credentials)).status).toBe(504);
  });

  it('returns 503 while disconnected from RabbitMQ', async () => {
    connection.connected = false;
    expect((await post('login', credentials)).status).toBe(503);
    expect(connection.request).not.toHaveBeenCalled();
  });

  it('does not expose broker failures', async () => {
    connection.request.mockRejectedValue(new Error('private broker details'));
    const result = await post('login', credentials);
    expect(result.status).toBe(503);
    expect(JSON.stringify(await result.json())).not.toContain(
      'private broker details',
    );
  });

  it.each([
    null,
    {},
    { accessToken: 123 },
    { accessToken: 'token', password: 'secret' },
    { access_token: 'token' },
    { error: { statusCode: 200, message: 'invalid' } },
    { error: { statusCode: 401 } },
  ])('returns 502 for a malformed RPC response: %j', async (response) => {
    connection.request.mockResolvedValue(response);
    expect((await post('login', credentials)).status).toBe(502);
  });

  it('authenticates locally and extracts only user fields through @User()', async () => {
    connection.connected = false;
    const token = jwt.sign({ ...claims, privateField: 'hidden' });
    const result = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(result.status).toBe(200);
    expect(await result.json()).toEqual({
      id: claims.sub,
      email: claims.email,
      role: claims.role,
    });
    expect(connection.request).not.toHaveBeenCalled();
  });

  it.each([
    ['missing token', undefined],
    ['invalid token', 'not-a-jwt'],
    [
      'wrong signature',
      jwt.sign(claims, { secret: 'different-secret-at-least-32-bytes' }),
    ],
    ['expired token', jwt.sign(claims, { expiresIn: -1 })],
    ['wrong algorithm', jwt.sign(claims, { algorithm: 'HS384' })],
    ['missing expiration', new JwtService({ secret }).sign(claims)],
    ['missing subject', jwt.sign({ email: claims.email, role: claims.role })],
    ['invalid email', jwt.sign({ ...claims, email: 'invalid' })],
    ['invalid role', jwt.sign({ ...claims, role: 'Admin' })],
    [
      'future token',
      jwt.sign({ ...claims, nbf: Math.floor(Date.now() / 1000) + 600 }),
    ],
  ])('returns 401 for %s', async (_reason, token) => {
    const result = await fetch(`${baseUrl}/api/auth/me`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    expect(result.status).toBe(401);
    expect(connection.request).not.toHaveBeenCalled();
  });
});
