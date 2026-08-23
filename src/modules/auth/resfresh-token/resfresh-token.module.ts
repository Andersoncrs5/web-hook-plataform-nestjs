import { Module } from "@nestjs/common";

import { CreateRefreshTokenService } from "./services/create/create-refresh-token.use-case.service";
import { DeleteRefreshTokenById } from "./services/delete/delete-refresh-token-by-id.use-case.service";
import { FindByRefreshTokenUseCase } from "./services/find-by-refresh-token/find-refresh-token-by-refresh-token.use-case.service";

import { IRefreshTokenRepository } from "./repository/irefresh-token.repository";
import { RefreshTokenRepository } from "./repository/refresh-token.repository";
import { FindRefreshTokenWithUserService } from "./services/find-token-by-hash-with-user/find-token-by-hash-with-user.service";
import { RevokeRefreshTokenUseCase } from "./services/revoke/revoke-refresh-token.use-case.service";

@Module({
    providers: [
        CreateRefreshTokenService,
        DeleteRefreshTokenById,
        FindByRefreshTokenUseCase,
        FindRefreshTokenWithUserService,
        RevokeRefreshTokenUseCase,

        RefreshTokenRepository,

        {
            provide: IRefreshTokenRepository,
            useExisting: RefreshTokenRepository,
        },
    ],

    exports: [
        CreateRefreshTokenService,
        DeleteRefreshTokenById,
        FindByRefreshTokenUseCase,
        FindRefreshTokenWithUserService,
        RevokeRefreshTokenUseCase,

        RefreshTokenRepository,
        IRefreshTokenRepository,
    ],
})
export class ResfreshTokenModule {}