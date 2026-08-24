import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
    BadRequestException,
    ConflictException,
} from "@nestjs/common";

import { Observable } from "rxjs";

import { CreateInboxUseCase } from "../services/create-inbox/creare-inbox.use-case.service";
import { ExistsInboxByMessageIdAndSourceUseCase } from "../services/exists-by-message-id-and-source/exists-by-message-id-and-source.use-case.service";
import { randomUUID } from "crypto";

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {

    constructor(
        private readonly createInbox: CreateInboxUseCase<unknown>,
        private readonly existsInbox: ExistsInboxByMessageIdAndSourceUseCase,
    ) {}

    async intercept(
        context: ExecutionContext,
        next: CallHandler,
    ): Promise<Observable<any>> {

        const request = context.switchToHttp().getRequest();

        const idempotencyKey =
            request.headers["x-idempotency-key"];

        if (!idempotencyKey) {
            throw new BadRequestException(
                "Idempotency-Key header is required.",
            );
        }

        if (Array.isArray(idempotencyKey)) {
            throw new BadRequestException(
                "Idempotency-Key header must contain a single value.",
            );
        }

        const routePath =
            request.route?.path ??
            request.baseUrl
                ? `${request.baseUrl}${request.route?.path ?? ""}`
                : request.url.split("?")[0];

        let source = `${request.method}:${routePath}`;

        if (source.length >= 150) {
            source = randomUUID()
        }

        const existsResult =
            await this.existsInbox.execute(
                idempotencyKey,
                source,
            );

        if (existsResult.isFailure) {
            throw new BadRequestException(
                existsResult.errors[0],
            );
        }

        if (existsResult.value) {
            throw new ConflictException(
                "Request with this Idempotency-Key has already been processed.",
            );
        }

        const inboxResult =
            await this.createInbox.execute({
                messageId: idempotencyKey,
                source,
                payload: request.body,
            });

        if (inboxResult.isFailure) {

            if (inboxResult.status === 409) {
                throw new ConflictException(
                    "Request with this Idempotency-Key has already been processed.",
                );
            }

            throw new BadRequestException(
                inboxResult.errors[0],
            );
        }

        return next.handle();
    }
}