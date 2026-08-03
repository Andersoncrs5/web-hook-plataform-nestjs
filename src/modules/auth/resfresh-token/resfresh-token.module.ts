import { Module } from '@nestjs/common';
import { CreateRefreshTokenService } from './services/create/create-refresh-token.use-case.service';
import { DeleteRefreshTokenById } from './services/delete/delete-refresh-token-by-id.use-case.service';
import { FindByRefreshTokenUseCase } from './services/find-by-refresh-token/find-refresh-token-by-refresh-token.use-case.service';
import { IRefreshTokenRepository } from './repository/irefresh-token.repository';
import { RefreshTokenRepository } from './repository/refresh-token.repository';

@Module({
    providers: [
        CreateRefreshTokenService,
        DeleteRefreshTokenById,
        FindByRefreshTokenUseCase,
        {
            provide: IRefreshTokenRepository,
            useClass: RefreshTokenRepository
        }
    ],
    exports: [
        CreateRefreshTokenService,
        DeleteRefreshTokenById,
        FindByRefreshTokenUseCase,
    ]
})
export class ResfreshTokenModule {}
