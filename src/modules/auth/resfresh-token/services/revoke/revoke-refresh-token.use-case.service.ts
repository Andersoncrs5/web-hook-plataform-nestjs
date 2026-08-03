import { Injectable, InternalServerErrorException, Logger } from "@nestjs/common";
import { IRefreshTokenRepository } from "../../repository/irefresh-token.repository";
import { isUUID } from "class-validator";
import { Result } from "src/common/result/result";
import { RefreshToken } from "../../entities/refresh-token.entity";

@Injectable()
export class RevokeRefreshTokenUseCase {
    private readonly logger = new Logger(RevokeRefreshTokenUseCase.name);

    constructor(
        private readonly repository: IRefreshTokenRepository
    ) {}

    async execute(id: string) {
        try {
            if (!isUUID(id)) {
                return Result.badRequest('Id should be a UUID');
            }

            const token = await this.repository.findById(id);

            if (token == null) {
                return Result.notFound('Refresh token not found');
            }

            const dateNow = new Date(); 

            if (token.expiresAt <= dateNow) {
                return Result.badRequest('Refresh token expired');
            }

            if (token.revokedAt != null) {
                return Result.badRequest('Refresh token already revoked'); 
            }

            token.revokedAt = dateNow;

            const tokenUpdated: RefreshToken = await this.repository.update(token);

            return Result.ok(tokenUpdated);
        } catch (error) {
            switch (error.code) {
                case '22001': {
                    return Result.badRequest('One or more fields exceed the maximum allowed length.');
                }

                case "23514": {
                    return Result.badRequest(
                        "Refresh token data violates a database constraint."
                    );
                }

                case "22P02": {
                    return Result.badRequest(
                        "Invalid refresh token data."
                    );
                }

                default:
                    this.logger.error(`Failed to revoke refresh token: ${error.message}`, error.stack);
                    throw new InternalServerErrorException('Error updating refresh token.'); // Ajustada a mensagem
            }
        }
    }
}