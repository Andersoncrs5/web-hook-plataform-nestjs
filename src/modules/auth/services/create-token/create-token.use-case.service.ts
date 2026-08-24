import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { User } from "src/modules/user/entities/user.entity";
import { Payload } from "../../classes/payload.class";
import { Tokens } from "../../classes/token.class";
import { CreateRefreshTokenService } from "../../resfresh-token/services/create/create-refresh-token.use-case.service";
import { Result } from "src/common/result/result";
import { UserMapper } from "src/modules/user/mapper/user.mapper";

@Injectable()
export class CreateTokensUseCase {
    constructor(
        private readonly jwtService: JwtService,
        private readonly createRefreshToken: CreateRefreshTokenService,
        private readonly configService: ConfigService,
    ) {}

    async execute(user: User, roles: string[] = []): Promise<Result<Tokens>> {
        const { token: accessToken, expiresAt: accessTokenExp } = this.createAccessToken(user, roles);
        const refreshTokenResult = await this.createRefreshToken.execute(user.id);

        if (refreshTokenResult.isFailure) {
            return Result.failure(refreshTokenResult.errors, refreshTokenResult.status);
        }

        const refreshToken = refreshTokenResult.value;
 
        const tokens = new Tokens();
        tokens.token = accessToken;
        tokens.tokenExp = accessTokenExp;
        tokens.refreshToken = refreshToken.tokenHash;
        tokens.refreshTokenExp = refreshToken.expiresAt;
        tokens.user = UserMapper.toDto(user)
        tokens.roles = roles

        return Result.ok(tokens);
    }

    private createAccessToken(user: User, roles: string[]): { token: string; expiresAt: Date } {
        const expiresInSeconds = Number(this.configService.getOrThrow<number>("JWT_EXPIRATION_SECONDS"));
        const issuer = this.configService.getOrThrow<string>("ISSUER");
        const audience = this.configService.getOrThrow<string>("AUDIENCE");

        const payload: Payload = {
            sub: user.id,
            email: user.email,
            name: user.name,
            roles: roles,
        };

        const token = this.jwtService.sign(payload, {
            expiresIn: expiresInSeconds,
            issuer: issuer,     
            audience: audience, 
        });

        const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);

        return { token, expiresAt };
    }
}