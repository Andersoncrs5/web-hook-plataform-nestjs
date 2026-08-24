import { Injectable } from "@nestjs/common";
import { IInboxRepository } from "../../repository/iinbox.repository";
import { CreateInboxDto } from "../../dto/create-inbox.dto";
import { Result } from "src/common/result/result";
import { InboxEntity } from "../../entities/inbox.entity";
import { CryptoService } from "src/common/crypto/crypto.service";
import { InboxStatus } from "src/utils/enums/inbox-status.enum";
import { PostgresResultHandler } from "src/common/result/postgres-result-handler.result";

@Injectable()
export class CreateInboxUseCase<T> {

    constructor(
        private readonly repository: IInboxRepository,
        private readonly cryptoService: CryptoService,
    ) {}

    async execute(
        dto: CreateInboxDto<T>,
    ): Promise<Result<InboxEntity>> {

        try {
            const inbox = {
                id: this.cryptoService.generateUuid(),
                messageId: dto.messageId,
                source: dto.source,
                status: InboxStatus.PENDING,
                payload: JSON.stringify(dto.payload),
            } as InboxEntity;

            const saved = await this.repository.create(inbox);

            return Result.created(saved);

        } catch (error) {
            return PostgresResultHandler.handle<InboxEntity>(error);
        }
    }
}