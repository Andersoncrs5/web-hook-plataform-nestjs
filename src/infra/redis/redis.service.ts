import { HttpStatus, Inject, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { REDIS } from './redis.provider';
import { Redis } from 'ioredis';
import { Result } from 'src/common/result/result';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
    constructor(
        @Inject(REDIS)
        private readonly redis: Redis,
    ) {}

    async onModuleInit() {
        await this.redis.ping();
        console.log('✅ Redis connected');
    }

    async onModuleDestroy() {
        await this.redis.quit();
    }

    async set<T>(key: string, value: T, ttl?: number): Promise<Result<boolean>> {
        const json: string = JSON.stringify(value);

        if (ttl) {
            await this.redis.set(key, json, 'EX', ttl);

            return Result.success(true, HttpStatus.OK);
        }

        await this.redis.set(key, json);

        return Result.success(true, HttpStatus.OK);
    }

    async get<T>(key: string): Promise<Result<T>> {
        const value: string | null = await this.redis.get(key);

        if (!value) {
            return Result.notFound<T>('Key not found');
        }

        const parse = JSON.parse(value) as T;

        return Result.success(parse);
    }

    async delete(key: string): Promise<Result<null>> {
        const deleted = await this.redis.del(key);

        if (deleted === 0) {
            return Result.notFound('Cache key not found');
        }

        return Result.success(null);
    }

    async exists(key: string): Promise<Result<null>> {
        const value: number = await this.redis.exists(key);

        if (!value) return Result.notFound();

        return Result.success(null, HttpStatus.OK);
    }

    async ttl(key: string): Promise<Result<number>> {
        const value: number = await this.redis.ttl(key);
        return Result.success(value);
    }

    async increment(key: string): Promise<Result<number>> {
        return Result.success(await this.redis.incr(key));
    }

    async clear(): Promise<Result<null>> {
        await this.redis.flushdb();
        return Result.success(null)
    }

}