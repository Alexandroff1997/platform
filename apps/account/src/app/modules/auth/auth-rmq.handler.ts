import { RabbitRPC } from '@golevelup/nestjs-rabbitmq';
import {
  BadRequestException,
  HttpException,
  Injectable,
  Logger,
  Type,
  ValidationPipe,
} from '@nestjs/common';
import {
  AccountLogin,
  AccountMessaging,
  AccountRegister,
  type RpcErrorResponse,
} from '@platform/contracts';
import { plainToInstance } from 'class-transformer';
import { validateOrReject } from 'class-validator';
import { AuthService } from './auth.service';

@Injectable()
export class AuthRmqHandler {
  private readonly logger = new Logger(AuthRmqHandler.name);
  private readonly validation = new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  });

  constructor(private readonly authService: AuthService) {}

  @RabbitRPC({
    exchange: AccountMessaging.exchange,
    routingKey: AccountLogin.topic,
    queue: AccountMessaging.queue,
    queueOptions: { durable: true },
  })
  async login(
    payload: unknown,
  ): Promise<AccountLogin.Response | RpcErrorResponse> {
    return this.execute(
      payload,
      AccountLogin.Request,
      AccountLogin.Response,
      (dto) => this.authService.login(dto.email, dto.password),
    );
  }

  @RabbitRPC({
    exchange: AccountMessaging.exchange,
    routingKey: AccountRegister.topic,
    queue: AccountMessaging.queue,
    queueOptions: { durable: true },
  })
  async register(
    payload: unknown,
  ): Promise<AccountRegister.Response | RpcErrorResponse> {
    return this.execute(
      payload,
      AccountRegister.Request,
      AccountRegister.Response,
      (dto) => this.authService.register(dto),
    );
  }

  private async execute<T extends object, R extends object>(
    payload: unknown,
    metatype: Type<T>,
    responseType: Type<R>,
    action: (dto: T) => Promise<R>,
  ): Promise<R | RpcErrorResponse> {
    try {
      if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
        throw new BadRequestException('Payload must be an object');
      }
      const dto: T = await this.validation.transform(payload, {
        type: 'body',
        metatype,
      });
      const response = plainToInstance(responseType, await action(dto));
      await validateOrReject(response, {
        whitelist: true,
        forbidNonWhitelisted: true,
        validationError: { target: false, value: false },
      });
      return response;
    } catch (error: unknown) {
      if (error instanceof HttpException && error.getStatus() < 500) {
        const response = error.getResponse();
        const message =
          typeof response === 'object' && 'message' in response
            ? (response as { message: string | string[] }).message
            : error.message;
        return { error: { statusCode: error.getStatus(), message } };
      }
      this.logger.error('Unexpected error while processing account RPC');
      return { error: { statusCode: 500, message: 'Internal server error' } };
    }
  }
}
