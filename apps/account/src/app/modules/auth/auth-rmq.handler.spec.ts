import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthRmqHandler } from './auth-rmq.handler';

describe('Auth RabbitMQ handlers', () => {
  let auth: { login: jest.Mock; register: jest.Mock };
  let handler: AuthRmqHandler;
  const credentials = { email: 'user@example.com', password: 'password' };

  beforeEach(() => {
    auth = {
      login: jest.fn().mockResolvedValue({ accessToken: 'signed-token' }),
      register: jest.fn().mockResolvedValue({
        email: credentials.email,
        message: 'User successfully created',
      }),
    };
    handler = new AuthRmqHandler(auth as unknown as AuthService);
  });

  it('returns an RPC accessToken for valid login', async () => {
    await expect(handler.login(credentials)).resolves.toEqual({
      accessToken: 'signed-token',
    });
    expect(auth.login).toHaveBeenCalledWith(
      credentials.email,
      credentials.password,
    );
  });

  it('returns registration result and preserves optional fields', async () => {
    const payload = { ...credentials, displayName: 'Teacher', role: 'Teacher' };
    await expect(handler.register(payload)).resolves.toEqual({
      email: credentials.email,
      message: 'User successfully created',
    });
    expect(auth.register).toHaveBeenCalledWith(payload);
  });

  it.each([
    null,
    [],
    {},
    { email: 'bad', password: 'password' },
    { ...credentials, extra: true },
    { ...credentials, password: 123 },
  ])('returns 400 for invalid login %j', async (payload) => {
    expect(await handler.login(payload)).toMatchObject({
      error: { statusCode: 400 },
    });
    expect(auth.login).not.toHaveBeenCalled();
  });

  it.each([
    { ...credentials, role: 'Admin' },
    { ...credentials, displayName: null },
    { ...credentials, displayName: ' ' },
  ])('validates registration %j', async (payload) => {
    expect(await handler.register(payload)).toMatchObject({
      error: { statusCode: 400 },
    });
    expect(auth.register).not.toHaveBeenCalled();
  });

  it('returns 401 for invalid credentials instead of timing out', async () => {
    auth.login.mockRejectedValue(
      new UnauthorizedException('Invalid credentials'),
    );
    await expect(handler.login(credentials)).resolves.toEqual({
      error: { statusCode: 401, message: 'Invalid credentials' },
    });
  });

  it('returns 409 for duplicate registration', async () => {
    auth.register.mockRejectedValue(
      new ConflictException('A user with this email already exists'),
    );
    expect(await handler.register(credentials)).toMatchObject({
      error: { statusCode: 409 },
    });
  });

  it('rejects an invalid outgoing response as an internal error', async () => {
    auth.login.mockResolvedValue({ accessToken: '' });
    await expect(handler.login(credentials)).resolves.toEqual({
      error: { statusCode: 500, message: 'Internal server error' },
    });
  });

  it('hides internal error details', async () => {
    auth.login.mockRejectedValue(new Error('database-password=secret'));
    await expect(handler.login(credentials)).resolves.toEqual({
      error: { statusCode: 500, message: 'Internal server error' },
    });
  });
});
