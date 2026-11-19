import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MessagingModule } from '../../messaging/messaging.module';
import { UserModule } from '../user/user.module';
import { AuthService } from './auth.service';
import { AuthRmqHandler } from './auth-rmq.handler';
import { createJwtOptions } from './jwt.config';

@Module({
  imports: [
    MessagingModule,
    UserModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        createJwtOptions(config.get<string>('JWT_SECRET')),
    }),
  ],
  providers: [AuthService, AuthRmqHandler],
})
export class AuthModule {}
