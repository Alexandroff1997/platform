import {
  IsEnum,
  IsNotEmpty,
  IsString,
  Matches,
  ValidateIf,
} from 'class-validator';
import { UserRole } from '@platform/shared';
import { LoginDto } from './login.dto';

export class RegisterDto extends LoginDto {
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
