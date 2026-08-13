import { Global, Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import { RedisProvider } from './redis.provider';
import { SecurityModule } from 'src/common/crypto/security.module';

@Global()
@Module({
    imports: [
        SecurityModule
    ],
    providers: [
        RedisProvider,
        RedisService,
    ],
    exports: [
        RedisService,
    ],
})
export class RedisModule {}