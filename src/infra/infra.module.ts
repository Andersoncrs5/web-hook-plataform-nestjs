import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { RedisModule } from './redis/redis.module';
import { RabbitmqModule } from './rabbitmq/rabbitmq.module';

@Module({
  imports: [DatabaseModule, RedisModule, RabbitmqModule],
  exports: [DatabaseModule, RedisModule, RabbitmqModule],

})
export class InfraModule {}
