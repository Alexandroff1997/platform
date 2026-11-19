import type { RabbitMQConfig } from '@golevelup/nestjs-rabbitmq';
import { AccountMessaging } from '@platform/contracts';

export function validateRabbitmqUrl(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) {
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
  if (!['amqp:', 'amqps:'].includes(url.protocol) || !url.hostname) {
    throw new Error(
      'RABBITMQ_URL must use amqp: or amqps: and include a broker host.',
    );
  }
  return value;
}

export function rabbitmqOptionsFactory(value: unknown): RabbitMQConfig {
  return {
    uri: validateRabbitmqUrl(value),
    exchanges: [
      {
        name: AccountMessaging.exchange,
        type: 'direct',
        options: { durable: true },
      },
    ],
    registerHandlers: false,
    enableDirectReplyTo: true,
    connectionInitOptions: { wait: true, reject: true, timeout: 10000 },
  };
}
