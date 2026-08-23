import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { RedisModule } from './redis/redis.module';
import { RabbitmqModule } from './rabbitmq/rabbitmq.module';
import { TransactionalMessagingModule } from './transactional-messaging/transactional-messaging.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { IdempotencyInterceptor } from './transactional-messaging/inbox/annotation/idempotency.interceptor';

@Module({
  imports: [
    DatabaseModule, 
    RedisModule, 
    RabbitmqModule, 
    TransactionalMessagingModule,
    
  ],
  exports: [
    DatabaseModule, 
    RedisModule, 
    RabbitmqModule, 
    TransactionalMessagingModule
  ],
  providers: [
        {
            provide: APP_INTERCEPTOR,
            useClass: IdempotencyInterceptor,
        },
    ],
})
export class InfraModule {}
