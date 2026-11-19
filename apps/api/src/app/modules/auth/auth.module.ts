import { Module } from '@nestjs/common';
import { JwtAuthModule } from '@platform/auth';
import { MessagingModule } from '../../messaging/messaging.module';
import { AuthController } from './auth.controller';
import { AccountAuthRmqClient } from './account-auth-rmq.client';

@Module({
  imports: [MessagingModule, JwtAuthModule],
  controllers: [AuthController],
  providers: [AccountAuthRmqClient],
})
export class AuthModule {}
