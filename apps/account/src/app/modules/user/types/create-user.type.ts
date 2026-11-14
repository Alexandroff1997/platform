import type { IUserWithCredentials } from './user.types';

export type CreateUserInput = Pick<
  IUserWithCredentials,
  'displayName' | 'email' | 'passwordHash'
> &
  Partial<Pick<IUserWithCredentials, 'role'>>;
