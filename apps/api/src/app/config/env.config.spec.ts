import { getApiEnvFiles, validateApiEnv } from './env.config';
import { rabbitmqOptionsFactory } from '../messaging/rabbitmq.config';
import { createJwtStrategyOptions } from '@platform/auth';

describe('API configuration', () => {
  it('loads service environment before repository environment', () => {
    expect(getApiEnvFiles('/workspace')).toEqual([
      '/workspace/apps/api/.env',
      '/workspace/.env',
    ]);
  });

  it.each([undefined, '', 'short', ' '.repeat(32)])(
    'rejects weak JWT secrets: %j',
    (secret) => {
      expect(() => createJwtStrategyOptions(secret)).toThrow(
        'JWT_SECRET must contain at least 32 UTF-8 bytes',
      );
    },
  );

  it('uses HS256 and checks expiration', () => {
    const secret = 'api-test-secret-at-least-32-bytes';
    expect(createJwtStrategyOptions(secret)).toMatchObject({
      secretOrKey: secret,
      algorithms: ['HS256'],
      ignoreExpiration: false,
    });
  });

  it.each([undefined, '', 'invalid', 'https://localhost', 'amqp:///'])(
    'rejects invalid RabbitMQ URL: %j',
    (url) => {
      expect(() => rabbitmqOptionsFactory(url)).toThrow('RABBITMQ_URL');
    },
  );

  it('configures only an RPC client with durable account exchange', () => {
    expect(rabbitmqOptionsFactory('amqp://localhost:5672')).toMatchObject({
      uri: 'amqp://localhost:5672',
      registerHandlers: false,
      enableDirectReplyTo: true,
      exchanges: [
        { name: 'account', type: 'direct', options: { durable: true } },
      ],
      connectionInitOptions: { wait: true, reject: true, timeout: 10000 },
    });
  });

  it('defaults to port 3000 and accepts a configured port', () => {
    expect(validateApiEnv({ RABBITMQ_URL: 'amqp://localhost' }).PORT).toBe(
      3000,
    );
    expect(
      validateApiEnv({ RABBITMQ_URL: 'amqp://localhost', PORT: '8080' }).PORT,
    ).toBe(8080);
  });

  it.each(['', 'invalid', '0', '-1', '65536', '1.5'])(
    'rejects invalid TCP port: %j',
    (port) => {
      expect(() =>
        validateApiEnv({ RABBITMQ_URL: 'amqp://localhost', PORT: port }),
      ).toThrow('PORT');
    },
  );
});
