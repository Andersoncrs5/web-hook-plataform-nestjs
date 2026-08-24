import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export const REDIS = 'REDIS';

export const RedisProvider: Provider = {
    provide: REDIS,
    inject: [ConfigService],

    useFactory: (configService: ConfigService) => {
        const host = configService.getOrThrow<string>('REDIS_HOST');
        const port = Number(configService.getOrThrow<number>('REDIS_PORT'));
        const password = configService.get<string>('REDIS_PASSWORD') || undefined;
        const db = Number(configService.get<number>('REDIS_DB', 0));
        
        const tlsRaw = configService.get<string | boolean>('REDIS_TLS', false);
        const enableTls = tlsRaw === true || tlsRaw === 'true';

        const readyCheckRaw = configService.get<string | boolean>('REDIS_READY_CHECK', true);
        const enableReadyCheck = readyCheckRaw === true || readyCheckRaw === 'true';

        const keyPrefix = configService.get<string>('REDIS_KEY_PREFIX', '');
        const keepAlive = Number(configService.getOrThrow<number>('REDIS_KEEP_ALIVE'));

        return new Redis({
            host: host,
            port: port,
            password: password,
            db: db,
            maxRetriesPerRequest: null, 
            enableReadyCheck: enableReadyCheck,
            connectTimeout: 10000, 
            keepAlive: keepAlive, 
            keyPrefix: keyPrefix,
            tls: enableTls ? {} : undefined, 

            retryStrategy: (times: number) => {
                const delay = Math.min(times * 100, 3000);
                return delay;
            },

            reconnectOnError: (err) => {
                const targetError = 'READONLY';
                if (err.message.includes(targetError)) {
                    return true;
                }
                return false;
            },
        });
    },
};