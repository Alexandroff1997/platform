import { AccountLogin, AccountRegister } from '@platform/contracts';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

describe('Account contract validation', () => {
  const options = { whitelist: true, forbidNonWhitelisted: true };

  it.each([AccountLogin.Request, AccountRegister.Request])(
    'accepts valid credentials using the public contract',
    async (contract) => {
      const instance = plainToInstance(contract, {
        email: 'user@example.com',
        password: 'password',
      });
      expect(await validate(instance, options)).toEqual([]);
    },
  );

  it.each([undefined, '', 123, 'я'.repeat(37)])(
    'rejects an invalid password: %j',
    async (password) => {
      const instance = plainToInstance(AccountLogin.Request, {
        email: 'user@example.com',
        password,
      });
      expect(
        (await validate(instance, options)).some(
          (error) => error.property === 'password',
        ),
      ).toBe(true);
    },
  );

  it.each([
    { email: 'invalid', password: 'password' },
    { email: 'user@example.com', password: 'password', extra: true },
    { email: 'user@example.com', password: 'password', role: null },
    { email: 'user@example.com', password: 'password', role: 'Admin' },
    { email: 'user@example.com', password: 'password', displayName: ' ' },
  ])('rejects invalid registration: %j', async (payload) => {
    expect(
      (
        await validate(
          plainToInstance(AccountRegister.Request, payload),
          options,
        )
      ).length,
    ).toBeGreaterThan(0);
  });

  it('validates login responses', async () => {
    expect(
      await validate(
        plainToInstance(AccountLogin.Response, { accessToken: 'token' }),
        options,
      ),
    ).toEqual([]);
    expect(
      (
        await validate(
          plainToInstance(AccountLogin.Response, { accessToken: '' }),
          options,
        )
      ).length,
    ).toBeGreaterThan(0);
  });

  it('validates registration responses', async () => {
    expect(
      await validate(
        plainToInstance(AccountRegister.Response, {
          email: 'user@example.com',
          message: 'User successfully created',
        }),
        options,
      ),
    ).toEqual([]);
    expect(
      (
        await validate(
          plainToInstance(AccountRegister.Response, {
            email: 'bad',
            message: '',
          }),
          options,
        )
      ).length,
    ).toBeGreaterThan(0);
  });
});
