import { IsByteLength, IsEmail, IsNotEmpty, IsString } from 'class-validator';

export const topic = 'account-login-command';

export class Request {
  @IsEmail()
  @IsNotEmpty()
  @IsString()
  email!: string;

  @IsString()
  @IsNotEmpty()
  @IsByteLength(1, 72, { message: 'Password must not exceed 72 UTF-8 bytes' })
  password!: string;
}

export class Response {
  @IsString()
  @IsNotEmpty()
  accessToken!: string;
}
