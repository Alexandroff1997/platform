import { JwtService } from '@nestjs/jwt';
import { createJwtOptions } from './jwt.config';

describe('JWT configuration', () => {
  it.each([undefined, '', 'short', ' '.repeat(32)])(
    'rejects a missing or weak JWT_SECRET: %j',
    async (secret) => {
      expect(() => createJwtOptions(secret)).toThrow(
        'JWT_SECRET must contain at least 32 UTF-8 bytes',
      );
    },
  );

  it('configures a signed HS256 token with one-hour expiration', async () => {
    const secret = 'configuration-test-secret-of-32-bytes';
    const jwt = new JwtService(createJwtOptions(secret));
    const token = await jwt.signAsync({ sub: 'user-id' });
    const payload = jwt.verify(token, { secret, algorithms: ['HS256'] });
    expect(payload.exp - payload.iat).toBe(3600);
  });
});
