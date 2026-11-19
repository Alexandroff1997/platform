import { Module } from '@nestjs/common';
import { JwtAuthModule } from '@platform/auth';
import { MessagingModule } from '../../messaging/messaging.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [MessagingModule, JwtAuthModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
