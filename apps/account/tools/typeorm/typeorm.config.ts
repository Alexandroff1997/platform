import { config } from 'dotenv';
import { join, resolve } from 'node:path';
import { DataSource } from 'typeorm';
import { getAccountEnvFiles } from '../../src/app/config/env-paths';
import { validateDatabaseUrl } from '../../src/app/database/database-url';

config({
  path: getAccountEnvFiles(join(__dirname, '../../../..')),
  override: false,
});

const dataSource = new DataSource({
  type: 'postgres',
  url: validateDatabaseUrl(process.env.DATABASE_URL),
  synchronize: false,
  migrationsRun: false,
  logging: false,
  entities: [resolve(__dirname, '../../src/**/*.entity.ts')],
  migrations: [resolve(__dirname, '../../src/app/database/migrations/*.ts')],
});

export default dataSource;
