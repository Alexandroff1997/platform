import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard, User, type AuthUser } from '@platform/auth';
import { AccountLogin, AccountRegister } from '@platform/contracts';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(
    @Body() dto: AccountRegister.Request,
  ): Promise<AccountRegister.Response> {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: AccountLogin.Request,
  ): Promise<{ access_token: string }> {
    const { accessToken } = await this.authService.login(dto);
    return { access_token: accessToken };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@User() user: AuthUser): AuthUser {
    return user;
  }
}
