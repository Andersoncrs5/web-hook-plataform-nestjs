import { Global, Module } from '@nestjs/common';
import { RedisService } from './redis.service';

@Global()
@Module({
  providers: [RedisService, RedisService],
  exports: [RedisService]
})
export class RedisModule {}
