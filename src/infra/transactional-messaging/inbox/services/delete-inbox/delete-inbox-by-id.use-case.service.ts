import { Injectable } from "@nestjs/common";
import { IInboxRepository } from "../../repository/iinbox.repository";
import { isUUID } from "class-validator";
import { Result } from "src/common/result/result";

@Injectable()
export class DeleteInboxByIdUseCase {
    constructor(
        private readonly repository: IInboxRepository
    ) {}

    async execute(id: string): Promise<Result<void>> {
        if (!isUUID(id)) return Result.badRequest('Id should be a UUID');

        const result: boolean = await this.repository.deleteById(id)

        if (result === false) {
            return Result.notFound('Role not found')
        }

        return Result.ok();
    }

}