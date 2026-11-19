import { ExtractJwt, type StrategyOptionsWithoutRequest } from 'passport-jwt';

export function createJwtStrategyOptions(
  secret: unknown,
): StrategyOptionsWithoutRequest {
  if (
    typeof secret !== 'string' ||
    Buffer.byteLength(secret.trim(), 'utf8') < 32
  ) {
    throw new Error('JWT_SECRET must contain at least 32 UTF-8 bytes');
  }
  return {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: secret,
    algorithms: ['HS256'],
    ignoreExpiration: false,
  };
}
