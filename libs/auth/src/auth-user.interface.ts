import type { IUser } from '@platform/shared';

export type AuthUser = Pick<IUser, 'id' | 'email' | 'role'>;
