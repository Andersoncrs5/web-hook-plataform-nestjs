import { Injectable } from "@nestjs/common";
import { IRefreshTokenRepository } from "../../repository/irefresh-token.repository";
import { Result } from "src/common/result/result";
import { isUUID } from "class-validator";

@Injectable()
export class DeleteRefreshTokenById {

    constructor(
        private readonly repository: IRefreshTokenRepository
    ) {}

    async execute(id: string) {
        if (!isUUID(id)) {
            return Result.badRequest('Id should be a UUID');
        }

        const result = await this.repository.deleteByIdAndCount(id)

        if (result == 0) {
            return Result.notFound('Refresh token not found');
        }

        return Result.ok();
    }

}