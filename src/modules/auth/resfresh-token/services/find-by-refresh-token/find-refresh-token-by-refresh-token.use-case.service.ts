import { Result } from "src/common/result/result";
import { RefreshToken } from "../../entities/refresh-token.entity";
import { IRefreshTokenRepository } from "../../repository/irefresh-token.repository";
import { Injectable, InternalServerErrorException, Logger } from "@nestjs/common";

@Injectable()
export class FindByRefreshTokenUseCase {
    private readonly logger = new Logger(FindByRefreshTokenUseCase.name);

    constructor(
        private readonly repository: IRefreshTokenRepository
    ) {}

    async execute(token: string): Promise<Result<RefreshToken>> {
        try {
            const refreshToken = await this.repository.findByTokenHash(token);

            if (!refreshToken) {
                return Result.notFound("Refresh token not found");
            }

            return Result.ok(refreshToken);
        } catch (error) {
            this.logger.error(`Failed to find refresh token: ${error.message}`, error.stack);
            throw new InternalServerErrorException("An unexpected error occurred while finding the refresh token.");
        }
    }
}