import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { FastifyRequest, FastifyReply } from 'fastify';
import { getRequestId } from '../http/request-id';
import { ResponseHTTP } from '../http/responseHttp.res';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  ResponseHTTP<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ResponseHTTP<T>> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<FastifyRequest>();
    const response = ctx.getResponse<FastifyReply>(); 

    const statusCode = response.statusCode;
    
    const isSuccess = statusCode >= 200 && statusCode < 300;

    return next.handle().pipe(
      map((data: T) => ({
        body: data,
        timestamp: new Date().toISOString(),
        path: request.url,
        method: request.method,
        traceId: getRequestId(request),
        status: isSuccess
      })),
    );
  }
}