import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { rabbitmqOptionsFactory } from './rabbitmq.config';

@Module({
  imports: [
    RabbitMQModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        rabbitmqOptionsFactory(config.get('RABBITMQ_URL')),
    }),
  ],
  exports: [RabbitMQModule],
})
export class MessagingModule {}
