import { Injectable } from "@nestjs/common";
import { FindByRefreshTokenUseCase } from "../../resfresh-token/services/find-by-refresh-token/find-refresh-token-by-refresh-token.use-case.service";
import { Result } from "src/common/result/result";
import { RefreshTokenEntity } from "../../resfresh-token/entities/refresh-token.entity";
import { CreateTokensUseCase } from "../create-token/create-token.use-case.service";
import { FindRefreshTokenWithUserService } from "../../resfresh-token/services/find-token-by-hash-with-user/find-token-by-hash-with-user.service";
import { User } from "src/modules/user/entities/user.entity";
import { Tokens } from "../../classes/token.class";
import { FindAllRoleNamesByUserIdUseCase } from "src/modules/user-role/services/find-all-roles-name-by-user-id/find-all-role-names-by-user-id.service";
import { RefreshTokenStatus } from "src/common/enums/refresh-token/refresh-token-status.enum";

@Injectable()
export class RotateRefreshTokenUseCase {
    constructor(
        private readonly createToken: CreateTokensUseCase,
        private readonly findRefreshToken: FindRefreshTokenWithUserService,
        private readonly findRoleNamesByUserId: FindAllRoleNamesByUserIdUseCase
    ){}

    async execute(tokenHash: string) {
        const tokenResult = await this.findRefreshToken.execute(tokenHash);
        if (tokenResult.isFailure) return Result.failure(tokenResult.errors, tokenResult.status)
        if (tokenResult.value == null) return Result.notFound('Refresh token not found');

        const token: RefreshTokenEntity = tokenResult.value.refreshToken;
        const user: User = tokenResult.value.user;

        if (token.expiresAt <= new Date()) return Result.badRequest('Token expired')
        if (token.revokedAt != null) {
            return Result.badRequest("Token revoked");
        }

        if (token.status !== RefreshTokenStatus.ACTIVE) {
            return Result.badRequest("Refresh token is not active");
        }

        if (token.expiresAt <= new Date()) {
            return Result.badRequest("Token expired");
        }

        const rolesResult = await this.findRoleNamesByUserId.execute(user.id);
        if (rolesResult.isFailure) return Result.failure(rolesResult.errors, rolesResult.status)
        const roles = rolesResult.value;
        
        const tokensResult: Result<Tokens> = await this.createToken.execute(user, roles)
        if (tokensResult.isFailure) return Result.failure(tokensResult.errors, tokensResult.status)

        return Result.ok(tokensResult.value);
    }

}