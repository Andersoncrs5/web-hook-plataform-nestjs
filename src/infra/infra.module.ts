import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { RedisModule } from './redis/redis.module';
import { RabbitmqModule } from './rabbitmq/rabbitmq.module';
import { TransactionalMessagingModule } from './transactional-messaging/transactional-messaging.module';

@Module({
  imports: [
    DatabaseModule, RedisModule, RabbitmqModule, TransactionalMessagingModule
  ],
  exports: [
    DatabaseModule, RedisModule, RabbitmqModule, TransactionalMessagingModule
  ],

})
export class InfraModule {}
