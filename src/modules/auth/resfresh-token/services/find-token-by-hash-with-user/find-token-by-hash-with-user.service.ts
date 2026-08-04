import { Injectable } from "@nestjs/common";

import { RefreshTokenRepository } from "../../repository/refresh-token.repository";
import { Result } from "src/common/result/result";
import { RefreshTokenEntity } from "../../entities/refresh-token.entity";
import { User } from "src/modules/user/entities/user.entity";

@Injectable()
export class FindRefreshTokenWithUserService {

    constructor(
        private readonly repository: RefreshTokenRepository,
    ) {}

    async execute(
        tokenHash: string,
    ): Promise<Result<{
        refreshToken: RefreshTokenEntity;
        user: User;
    } | null>> 
    {
        const refreshToken =
            await this.repository.findByTokenHashWithUser(tokenHash);

        if (!refreshToken) {
            return Result.notFound(
                "Refresh token not found.",
            );
        }

        return Result.ok(refreshToken);
    }
}