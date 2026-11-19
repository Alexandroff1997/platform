import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { join } from 'node:path';
import { getAccountEnvFiles } from './config/env-paths';
import { validateDatabaseUrl } from './database/database-url';
import { DatabaseModule } from './database/database.module';
import { validateRabbitmqUrl } from './messaging/rabbitmq.config';
import { AuthModule } from './modules/auth/auth.module';

function validateEnv(config: Record<string, unknown>): Record<string, unknown> {
  config.DATABASE_URL = validateDatabaseUrl(config.DATABASE_URL);
  config.RABBITMQ_URL = validateRabbitmqUrl(config.RABBITMQ_URL);
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
    AuthModule,
  ],
})
export class AppModule {}
