import {
  defaultNackErrorHandler,
  type RabbitMQConfig,
} from '@golevelup/nestjs-rabbitmq';
import { AccountMessaging } from '@platform/contracts';

export function validateRabbitmqUrl(value: unknown): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(
      'RABBITMQ_URL is missing or empty. Set it to an AMQP connection URL.',
    );
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error('RABBITMQ_URL must be a valid AMQP connection URL.');
  }

  if (
    (url.protocol !== 'amqp:' && url.protocol !== 'amqps:') ||
    !url.hostname
  ) {
    throw new Error(
      'RABBITMQ_URL must use amqp: or amqps: and include a broker host.',
    );
  }

  return value;
}

export function rabbitmqOptionsFactory(value: unknown): RabbitMQConfig {
  return {
    uri: validateRabbitmqUrl(value),
    prefetchCount: 32,
    exchanges: [
      {
        name: AccountMessaging.exchange,
        type: 'direct',
        options: { durable: true },
      },
    ],
    defaultRpcErrorHandler: defaultNackErrorHandler,
    connectionInitOptions: { wait: true, reject: true, timeout: 10000 },
  };
}
