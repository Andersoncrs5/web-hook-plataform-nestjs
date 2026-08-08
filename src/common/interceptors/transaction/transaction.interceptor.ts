import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";
import { from, lastValueFrom } from "rxjs";
import { DatabaseService } from "src/infra/database/database.service";
import { TransactionContextService } from "./transaction-context.service";

@Injectable()
export class TransactionInterceptor implements NestInterceptor {
  constructor(
    private readonly database: DatabaseService,
    private readonly txContext: TransactionContextService,
  ) {}

  intercept(_: ExecutionContext, next: CallHandler) {
    return from(
      this.database.connection.transaction(async (tx: any) => {
        return this.txContext.run(tx, async () => {
          return lastValueFrom(next.handle());
        });
      }),
    );
  }
}