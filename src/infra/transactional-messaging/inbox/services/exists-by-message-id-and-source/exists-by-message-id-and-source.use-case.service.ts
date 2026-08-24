import { Injectable } from "@nestjs/common";

import { IInboxRepository } from "../../repository/iinbox.repository";
import { Result } from "src/common/result/result";
import { isUUID } from "class-validator";

@Injectable()
export class ExistsInboxByMessageIdAndSourceUseCase {

    constructor(
        private readonly repository: IInboxRepository,
    ) {}

    async execute(
        messageId: string,
        source: string,
    ): Promise<Result<boolean>> {
        if (!isUUID(messageId)) return Result.badRequest('Id should be UUID')

        const exists = await this.repository.existsByMessageIdAndSource(messageId, source);

        return Result.ok(exists);
    }
}