import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { configureHttpApp } from './app/http.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  configureHttpApp(app);
  app.enableShutdownHooks();
  const port = app.get(ConfigService).getOrThrow<number>('PORT');
  await app.listen(port);
  if (process.env.NX_READY_SIGNAL_SOCKET) {
    try {
      const load = new Function('s', 'return import(s)') as (
        s: string,
      ) => Promise<{ emitReadySignal(server: unknown): boolean }>;
      (await load('@nx/js/ready-signal')).emitReadySignal(app.getHttpServer());
    } catch {
      // @nx/js isn't installed
    }
  }
  Logger.log(`API gateway is running on: http://localhost:${port}/api`);
}

bootstrap();
