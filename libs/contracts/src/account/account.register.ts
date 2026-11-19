import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  Matches,
  ValidateIf,
} from 'class-validator';
import { UserRole } from '@platform/shared';
import { Request as LoginRequest } from './account.login';

export const topic = 'account-register-command';

export class Request extends LoginRequest {
  @ValidateIf((_object, value) => value !== undefined)
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/, {
    message: 'displayName must contain a non-whitespace character',
  })
  displayName?: string;

  @ValidateIf((_object, value) => value !== undefined)
  @IsEnum(UserRole)
  role?: UserRole;
}

export class Response {
  @IsEmail()
  @IsNotEmpty()
  @IsString()
  email!: string;

  @IsString()
  @IsNotEmpty()
  message!: string;
}
