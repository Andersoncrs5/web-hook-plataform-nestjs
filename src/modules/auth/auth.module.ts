import { Module } from '@nestjs/common';
import { AuthController } from './controller/auth.controller';
import { JwtModule } from '@nestjs/jwt';

import { CreateTokensUseCase } from './services/create-token/create-token.use-case.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RotateRefreshTokenUseCase } from './services/rotate-refresh-token/rotate-refresh-token.use-case.service';

import { ResfreshTokenModule } from './resfresh-token/resfresh-token.module';
import { UserRoleModule } from '../user-role/user-role.module';
import { TransactionalMessagingModule } from 'src/infra/transactional-messaging/transactional-messaging.module';
import { UserModule } from '../user/user.module';
import { LoginUserUseCase } from './services/login-user/login-user.use-case.service';
import { RegisterUserService } from './services/register-user/register-user.use-case.service';
import { RolesModule } from '../roles/roles.module';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
    imports: [
        ResfreshTokenModule,
        UserRoleModule,
        TransactionalMessagingModule,
        UserModule,
        RolesModule,

        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                secret: config.getOrThrow<string>("JWT_SECRET"),
            }),
        }),
    ],

    controllers: [
        AuthController,
    ],

    providers: [
        CreateTokensUseCase,
        RotateRefreshTokenUseCase,
        RegisterUserService,
        JwtStrategy,
        LoginUserUseCase
    ],

    exports: [
        
        JwtStrategy,
        CreateTokensUseCase,
    ],
})
export class AuthModule {}