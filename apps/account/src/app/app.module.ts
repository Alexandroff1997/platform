import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { join } from 'node:path';
import { getAccountEnvFiles } from './config/env-paths';
import { validateDatabaseUrl } from './database/database-url';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';

function validateEnv(config: Record<string, unknown>): Record<string, unknown> {
  config.DATABASE_URL = validateDatabaseUrl(config.DATABASE_URL);
  return config;
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: getAccountEnvFiles(join(__dirname, '../../..')),
      validate: validateEnv,
    }),
    DatabaseModule,
    UserModule,
    AuthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
