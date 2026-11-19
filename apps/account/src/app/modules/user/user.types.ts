import type { IUser } from '@platform/shared';

export interface IUserWithCredentials extends IUser {
  passwordHash: string;
}

export type CreateUserInput = Pick<
  IUserWithCredentials,
  'displayName' | 'email' | 'passwordHash'
> &
  Partial<Pick<IUserWithCredentials, 'role'>>;
