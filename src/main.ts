import { NestFactory } from "@nestjs/core";
import {
    FastifyAdapter,
    NestFastifyApplication,
} from "@nestjs/platform-fastify";
import {
    ValidationPipe,
    VersioningType,
} from "@nestjs/common";
import {
    DocumentBuilder,
    SwaggerModule,
} from "@nestjs/swagger";
import { useContainer } from "class-validator";
import { randomUUID } from "node:crypto";
import multipart from "@fastify/multipart";

import { AppModule } from "./app.module";
import { GlobalExceptionFilter } from "./utils/exceptions/all-exceptions.filter";
import { TransformInterceptor } from "./utils/interceptors/transform.interceptor";


async function bootstrap() {

    const port = Number(process.env.PORT);

    const host = process.env.HOST || "0.0.0.0";

    const app =
        await NestFactory.create<NestFastifyApplication>(
            AppModule,
            new FastifyAdapter({
                genReqId: () => randomUUID(),
            }),
        );


    // ========================================================
    // MULTIPART
    // ========================================================

    await app.register(multipart, {
        limits: {
            fileSize:
                (Number(process.env.MULTIPART_FILE_SIZE_MB) || 40)
                * 1024
                * 1024,
        },
    });

    // ========================================================
    // CORS
    // ========================================================

    app.enableCors({
        origin:
            process.env.CORS_ORIGIN === "true"
                ? true
                : process.env.CORS_ORIGIN,

        methods: "GET,HEAD,PUT,PATCH,POST,DELETE",

        credentials:
            process.env.CORS_CREDENTIALS === "true",
    });


    // ========================================================
    // API VERSIONING
    // ========================================================

    app.enableVersioning({
        type: VersioningType.URI,

        defaultVersion:
            process.env.API_VERSION || "1",
    });


    // ========================================================
    // VALIDATION
    // ========================================================

    app.useGlobalPipes(
        new ValidationPipe({
            whitelist:
                process.env.GLOBAL_PIPES_WHITELIST === "true",

            forbidNonWhitelisted:
                process.env.GLOBAL_PIPES_FORBID_NON_WHITE_LISTED === "true",

            transform:
                process.env.GLOBAL_PIPES_TRANSFORM === "true",
        }),
    );


    // ========================================================
    // GLOBAL HANDLERS
    // ========================================================

    app.useGlobalFilters(
        new GlobalExceptionFilter(),
    );

    app.useGlobalInterceptors(
        new TransformInterceptor(),
    );

    useContainer(
        app.select(AppModule),
        {
            fallbackOnErrors: true,
        },
    );


    // ========================================================
    // SWAGGER
    // ========================================================

    if (process.env.SWAGGER_ENABLED === "true") {

        const config =
            new DocumentBuilder()
                .setTitle(
                    process.env.APP_NAME ||
                    "Webhook Platform API",
                )
                .setDescription(
                    process.env.APP_DESCRIPTION ||
                    "Documentação técnica da Webhook Platform",
                )
                .setVersion(
                    process.env.APP_VERSION ||
                    "1.0",
                )
                .addBearerAuth()
                .build();


        const document =
            SwaggerModule.createDocument(
                app,
                config,
            );


        SwaggerModule.setup(
            process.env.SWAGGER_PATH || "api",
            app,
            document,
        );
    }


    // ========================================================
    // START
    // ========================================================

    await app.listen(
        port,
        host,
    );


    console.log(
        `🚀 Application is running on: http://localhost:${port}/${process.env.API_PREFIX || "v1"}`,
    );

    if (process.env.SWAGGER_ENABLED === "true") {
        console.log(
            `📄 Swagger documentation: http://localhost:${port}/${process.env.SWAGGER_PATH || "api"}`,
        );
    }
}


bootstrap();