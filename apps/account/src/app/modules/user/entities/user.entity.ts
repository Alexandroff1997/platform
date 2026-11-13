import { UserRole } from '@platform/shared';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { IUserWithCredentials } from '../types/user.types';

@Entity('users')
export class UserEntity implements IUserWithCredentials {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'display_name' })
  displayName: string;

  @Column({ unique: true })
  email: string;

  @Column({ name: 'password_hash' })
  passwordHash: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.Student })
  role: UserRole;
}
