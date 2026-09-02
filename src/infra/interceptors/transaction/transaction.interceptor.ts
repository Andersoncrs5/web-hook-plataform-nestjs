import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, lastValueFrom } from 'rxjs';
import { FastifyReply } from 'fastify';
import { transactionStorage } from './transaction.storage';
import { DatabaseService } from 'src/infra/database/database.service';

@Injectable()
export class TransactionInterceptor implements NestInterceptor {
  constructor(private readonly databaseService: DatabaseService) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    return new Observable((subscriber) => {
      this.databaseService.rawPool
        .transaction(async (tx) => {
          await transactionStorage.run(tx, async () => {
            try {
              const result = await lastValueFrom(next.handle());
              const response = context.switchToHttp().getResponse<FastifyReply>();

              if (response.statusCode >= 400 && response.statusCode <= 599) {
                throw new Error(`Rollback forçado pelo status HTTP ${response.statusCode}`);
              }

              subscriber.next(result);
              subscriber.complete();
            } catch (error) {
              subscriber.error(error);
              throw error;
            }
          });
        })
        .catch(() => {});
    });
  }
}
