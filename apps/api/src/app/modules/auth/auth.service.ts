import { AmqpConnection, RpcTimeoutError } from '@golevelup/nestjs-rabbitmq';
import {
  BadGatewayException,
  GatewayTimeoutException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  ServiceUnavailableException,
  type Type,
} from '@nestjs/common';
import {
  AccountLogin,
  AccountMessaging,
  AccountRegister,
  type RpcErrorResponse,
} from '@platform/contracts';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

function isRpcErrorResponse(value: unknown): value is RpcErrorResponse {
  if (!value || typeof value !== 'object' || !('error' in value)) return false;
  const error = value.error;
  if (
    !error ||
    typeof error !== 'object' ||
    !('statusCode' in error) ||
    !('message' in error)
  )
    return false;
  const { statusCode, message } = error;
  return (
    Number.isInteger(statusCode) &&
    Number(statusCode) >= 400 &&
    Number(statusCode) <= 599 &&
    (typeof message === 'string' ||
      (Array.isArray(message) &&
        message.every((item) => typeof item === 'string')))
  );
}

@Injectable()
export class AuthService {
  constructor(private readonly connection: AmqpConnection) {}

  login(dto: AccountLogin.Request): Promise<AccountLogin.Response> {
    return this.request(AccountLogin.topic, dto, AccountLogin.Response);
  }

  register(dto: AccountRegister.Request): Promise<AccountRegister.Response> {
    return this.request(AccountRegister.topic, dto, AccountRegister.Response);
  }

  private async request<T extends object>(
    routingKey: string,
    payload: object,
    responseType: Type<T>,
  ): Promise<T> {
    if (!this.connection.connected) {
      throw new ServiceUnavailableException('Account service is unavailable');
    }
    let result: unknown;
    try {
      result = await this.connection.request<unknown>({
        exchange: AccountMessaging.exchange,
        routingKey,
        payload,
        timeout: 10000,
      });
    } catch (error: unknown) {
      if (error instanceof RpcTimeoutError) {
        throw new GatewayTimeoutException('Account service request timed out');
      }
      throw new ServiceUnavailableException('Account service is unavailable');
    }
    if (isRpcErrorResponse(result)) {
      if (result.error.statusCode >= 500)
        throw new InternalServerErrorException('Internal server error');
      const { statusCode, message } = result.error;
      throw new HttpException({ statusCode, message }, statusCode);
    }
    if (!result || typeof result !== 'object' || Array.isArray(result)) {
      throw new BadGatewayException('Invalid response from account service');
    }
    const response = plainToInstance(responseType, result);
    const errors = await validate(response, {
      whitelist: true,
      forbidNonWhitelisted: true,
      validationError: { target: false, value: false },
    });
    if (errors.length)
      throw new BadGatewayException('Invalid response from account service');
    return response;
  }
}
