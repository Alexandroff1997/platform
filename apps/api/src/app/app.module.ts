import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { join } from 'node:path';
import { getApiEnvFiles, validateApiEnv } from './config/env.config';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: getApiEnvFiles(join(__dirname, '../../..')),
      validate: validateApiEnv,
    }),
    AuthModule,
  ],
})
export class AppModule {}
