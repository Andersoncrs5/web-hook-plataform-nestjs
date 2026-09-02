import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'node:async_hooks';

@Injectable()
export class TransactionContextService {
  private readonly als = new AsyncLocalStorage<any>();

  run<T>(tx: any, fn: () => Promise<T>): Promise<T> {
    return this.als.run(tx, fn);
  }

  get current() {
    return this.als.getStore();
  }
}
