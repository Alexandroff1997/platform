import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { validateDatabaseUrl } from './database-url';

export function databaseTypeOrmOptionsFactory(
  configService: ConfigService,
): TypeOrmModuleOptions {
  return {
    type: 'postgres',
    url: validateDatabaseUrl(configService.get('DATABASE_URL')),
    autoLoadEntities: true,
    synchronize: false,
    migrationsRun: false,
    logging: false,
  };
}

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: databaseTypeOrmOptionsFactory,
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
