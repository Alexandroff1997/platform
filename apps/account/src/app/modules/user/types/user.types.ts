import type { IUser } from '@platform/shared';

export interface IUserWithCredentials extends IUser {
  passwordHash: string;
}
