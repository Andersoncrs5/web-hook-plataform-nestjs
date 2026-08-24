import { Injectable } from "@nestjs/common";
import { IInboxRepository } from "../../repository/iinbox.repository";
import { InboxEntity } from "../../entities/inbox.entity";
import { Result } from "src/common/result/result";

@Injectable()
export class FindByMessageIdAndSourceUseCase {
    constructor(
        private readonly inboxRepository: IInboxRepository,
    ) {}

    async execute(messageId: string, source: string): Promise<Result<InboxEntity>> {
        if (!messageId || typeof messageId !== 'string' || messageId.trim().length === 0) {
            return Result.badRequest('Message ID is required');
        }

        if (!source || typeof source !== 'string' || source.trim().length === 0) {
            return Result.badRequest('Source is required');
        }

        const inbox = await this.inboxRepository.findByMessageIdAndSource(
            messageId.trim(), 
            source.trim()
        );

        if (!inbox) {
            return Result.notFound('Inbox message not found');
        }

        return Result.ok(inbox);
    }
}