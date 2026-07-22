import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';
import { UniqueConstraintViolationException } from './classes/unique-constraint-violation.exception';
import { getRequestId } from '../http/request-id';
import { ResponseHTTP } from '../http/responseHttp.res';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  private readonly exceptionMap = new Map<any, number>([
    [UniqueConstraintViolationException, HttpStatus.BAD_REQUEST],
    [UnauthorizedException, HttpStatus.UNAUTHORIZED],
    [ForbiddenException, HttpStatus.FORBIDDEN],
  ]);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | object = 'Internal server error';

    const constructor = (exception as any)?.constructor;
    const customStatus = this.exceptionMap.get(constructor);

    if (customStatus) {
      status = customStatus;
      message = (exception as Error).message;
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = exception.getResponse();
    }

    if (status >= 500) {
      this.logger.error(
        `Method: ${request.method} | Path: ${request.url} | Status: ${status}`,
        exception instanceof Error ? exception.stack : '',
      );
    }

    const responseHTTP: ResponseHTTP<any> = {
      body: null,
      message:
        typeof message === 'string'
          ? message
          : (message as any).message || message,
      path: request.url,
      method: request.method,
      traceId: getRequestId(request),
      timestamp: new Date().toISOString(),
      status: false,
    };

    response.status(status).send(responseHTTP);
  }
}
