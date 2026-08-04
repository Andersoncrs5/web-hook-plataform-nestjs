import { Module } from '@nestjs/common';
import { AuthController } from './controller/auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { CreateTokensUseCase } from './services/create-token/create-token.use-case.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RefreshTokenRepository } from './resfresh-token/repository/refresh-token.repository';
import { CreateRefreshTokenService } from './resfresh-token/services/create/create-refresh-token.use-case.service';
import { FindByRefreshTokenUseCase } from './resfresh-token/services/find-by-refresh-token/find-refresh-token-by-refresh-token.use-case.service';
import { RevokeRefreshTokenUseCase } from './resfresh-token/services/revoke/revoke-refresh-token.use-case.service';
import { RotateRefreshTokenUseCase } from './services/rotate-refresh-token/rotate-refresh-token.use-case.service';

@Module({
  imports: [
    JwtModule,
  ],
  controllers: [
    AuthController,
  ],
  providers: [
    //LoginUserUseCase,
    CreateTokensUseCase,

    RefreshTokenRepository,
    CreateRefreshTokenService,
    FindByRefreshTokenUseCase,
    RotateRefreshTokenUseCase,
    RevokeRefreshTokenUseCase,

    JwtStrategy,
  ],
  exports: [
    JwtStrategy,
    CreateTokensUseCase,
    RefreshTokenRepository,
  ],
})
export class AuthModule {}
