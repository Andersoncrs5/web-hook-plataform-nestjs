import { Test, TestingModule } from "@nestjs/testing";
import { ValidationPipe } from "@nestjs/common";
import {
    FastifyAdapter,
    NestFastifyApplication,
} from "@nestjs/platform-fastify";
import {
    PostgreSqlContainer,
    StartedPostgreSqlContainer,
} from "@testcontainers/postgresql";
import {
    RedisContainer,
    StartedRedisContainer,
} from "@testcontainers/redis";
import { randomUUID } from "node:crypto";
import { GlobalExceptionFilter } from "../../src/utils/exceptions/all-exceptions.filter";
import { TransformInterceptor } from "../../src/utils/interceptors/transform.interceptor";

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import * as path from 'path';

export class BaseIntegrationTest {

    protected static app: NestFastifyApplication;

    protected static postgres: StartedPostgreSqlContainer;

    protected static redis: StartedRedisContainer;

    static async setupAll(): Promise<void> {

        // 1. Sobe os containers de Testes
        this.postgres = await new PostgreSqlContainer(
            "postgres:18-alpine",
        )
            .withDatabase("web_hook_db")
            .withUsername("pochita")
            .withPassword("pochita")
            .start();

        this.redis = await new RedisContainer(
            "redis:8-alpine",
        ).start();

        // 2. Preenche o process.env ANTES de importar o AppModule
        process.env.NODE_ENV = "test";
        process.env.PORT = "3000";
        process.env.HOST = "0.0.0.0";

        process.env.DB_HOST = this.postgres.getHost();
        process.env.DB_PORT = this.postgres.getPort().toString();
        process.env.DB_USER = this.postgres.getUsername();
        process.env.DB_PASSWORD = this.postgres.getPassword();
        process.env.DB_NAME = this.postgres.getDatabase();
        process.env.DATABASE_URL = this.postgres.getConnectionUri();

        process.env.REDIS_HOST = this.redis.getHost();
        process.env.REDIS_PORT = this.redis.getMappedPort(6379).toString();
        process.env.REDIS_PASSWORD = "";
        process.env.REDIS_DB = "0";
        process.env.REDIS_TLS = "false";
        process.env.REDIS_READY_CHECK = "true";
        process.env.REDIS_KEY_PREFIX = "";
        process.env.REDIS_KEEP_ALIVE = "30000";

        process.env.JWT_SECRET =
            "integration-test-secret-key-change-me-very-long-256-bit";
        process.env.JWT_EXPIRATION_SECONDS = "3600";
        process.env.ISSUER = "webhook-platform-test";
        process.env.AUDIENCE = "webhook-platform-api-test";

        // Variável ROLES necessária para o Zod / RoleBootstrapTask
        process.env.ROLES = "USER,MODERATOR,SUPPORT,AUDITOR,ADMIN,MASTER";

        process.env.NAME_MASTER = "user"
        process.env.FULL_NAME_MASTER = "user master system"
        process.env.EMAIL_MASTER = "user.master.210@gmail.com"
        process.env.PASSWORD_MASTER = "12345678"

        // 3. Executa as Migrações
        const migrationsFolder = path.resolve(
            __dirname,
            '../../src/infra/database/migrations',
        );

        const migrationClient = postgres(
            process.env.DATABASE_URL!,
            { max: 20 },
        );

        const migrationDb = drizzle(migrationClient);

        await migrate(migrationDb, {
            migrationsFolder,
        });

        await migrationClient.end();

        const { AppModule } = require("../../src/app.module");

        const moduleFixture: TestingModule =
            await Test.createTestingModule({
                imports: [AppModule],
            }).compile();

        this.app =
            moduleFixture.createNestApplication<NestFastifyApplication>(
                new FastifyAdapter({
                    genReqId: () => randomUUID(),
                }),
            );

        this.app.useGlobalPipes(
            new ValidationPipe({
                transform: true,
                whitelist: true,
            }),
        );

        this.app.useGlobalFilters(
            new GlobalExceptionFilter(),
        );

        this.app.useGlobalInterceptors(
            new TransformInterceptor(),
        );

        await this.app.init();

        await this.app
            .getHttpAdapter()
            .getInstance()
            .ready();
    }

    static async teardownAll(): Promise<void> {

        if (this.app) {
            await this.app.close();
        }

        if (this.postgres) {
            await this.postgres.stop();
        }

        if (this.redis) {
            await this.redis.stop();
        }
    }

    static getApp(): NestFastifyApplication {
        return this.app;
    }
}