import { Injectable } from "@nestjs/common";
import { IInboxRepository } from "../../repository/iinbox.repository";
import { UpdateInboxDto } from "../../dto/update-inboox.dto";
import { PostgresResultHandler } from "src/common/result/postgres-result-handler.result";
import { InboxEntity } from "../../entities/inbox.entity";
import { InboxMapper } from "../../mapper/inbox.mapper";
import { Result } from "src/common/result/result";
import { isUUID } from "class-validator";

@Injectable()
export class UpdateInboxUseCase {
    constructor(
        private readonly inboxRepository: IInboxRepository,
    ){}

    async execute(id: string, dto: UpdateInboxDto) {
        if (!isUUID(id)) return Result.badRequest('Id should be UUID')

        try {
            const inbox = await this.inboxRepository.findById(id);

            if (!inbox) return Result.notFound('Inbox message not found');

            InboxMapper.merge(inbox, dto)

            const updated = await this.inboxRepository.update(inbox)

            return Result.ok(updated)
        } catch (error) {
            return PostgresResultHandler.handle<InboxEntity>(error);
        }
    }

}