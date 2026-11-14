import type { JwtModuleOptions } from '@nestjs/jwt';

export function createJwtOptions(secret: unknown): JwtModuleOptions {
  if (
    typeof secret !== 'string' ||
    Buffer.byteLength(secret.trim(), 'utf8') < 32
  ) {
    throw new Error('JWT_SECRET must contain at least 32 UTF-8 bytes');
  }
  return { secret, signOptions: { expiresIn: 3600, algorithm: 'HS256' } };
}
