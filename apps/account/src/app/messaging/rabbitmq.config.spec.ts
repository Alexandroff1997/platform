import { rabbitmqOptionsFactory, validateRabbitmqUrl } from './rabbitmq.config';

describe('RabbitMQ configuration', () => {
  it.each([undefined, null, 123, '', '   '])(
    'rejects a missing or empty RABBITMQ_URL: %j',
    (value) => {
      expect(() => validateRabbitmqUrl(value)).toThrow(/RABBITMQ_URL/);
    },
  );

  it.each([
    'not-a-url',
    'http://localhost:5672',
    'amqp://',
    'amqp:///vhost',
    'amqp://localhost:invalid',
  ])('rejects an invalid broker URL: %s', (value) => {
    expect(() => validateRabbitmqUrl(value)).toThrow(/RABBITMQ_URL/);
  });

  it.each([
    'amqp://platform:password@127.0.0.1:5672',
    'amqps://platform:password@broker.example.com:5671/%2F',
    'amqp://localhost',
  ])('accepts an AMQP broker URL: %s', (value) => {
    expect(validateRabbitmqUrl(value)).toBe(value);
  });

  it('does not expose credentials in validation errors', () => {
    expect(() => validateRabbitmqUrl('https://user:secret@host')).toThrow(
      /RABBITMQ_URL/,
    );
    try {
      validateRabbitmqUrl('https://user:secret@host');
    } catch (error) {
      expect((error as Error).message).not.toContain('secret');
    }
  });

  it('rejects missing configuration when creating connection options', () => {
    expect(() => rabbitmqOptionsFactory(undefined)).toThrow(/RABBITMQ_URL/);
  });

  it('uses configured URI and requires a connection within ten seconds', () => {
    const options = rabbitmqOptionsFactory('amqp://localhost:5672');
    expect(options.uri).toBe('amqp://localhost:5672');
    expect(options.prefetchCount).toBe(32);
    expect(options.exchanges).toEqual([
      { name: 'account', type: 'direct', options: { durable: true } },
    ]);
    expect(options.connectionInitOptions).toEqual({
      wait: true,
      reject: true,
      timeout: 10000,
    });
  });
});
