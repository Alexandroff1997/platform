import { join, resolve } from 'node:path';
import { validateRabbitmqUrl } from '../messaging/rabbitmq.config';

export function getApiEnvFiles(rootDir: string): string[] {
  const root = resolve(rootDir);
  return [join(root, 'apps/api/.env'), join(root, '.env')];
}

export function validateApiEnv(
  config: Record<string, unknown>,
): Record<string, unknown> {
  config.RABBITMQ_URL = validateRabbitmqUrl(config.RABBITMQ_URL);
  const port = config.PORT === undefined ? 3000 : Number(config.PORT);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535');
  }
  config.PORT = port;
  return config;
}
