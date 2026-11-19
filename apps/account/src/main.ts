import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  app.enableShutdownHooks();
  if (process.env.NX_READY_SIGNAL_SOCKET) {
    try {
      const load = new Function('s', 'return import(s)') as (
        s: string,
      ) => Promise<{ emitReadySignal(): boolean }>;
      (await load('@nx/js/ready-signal')).emitReadySignal();
    } catch {
      // @nx/js isn't installed
    }
  }
  Logger.log('Account microservice is running over RabbitMQ');
}

bootstrap();
