import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import dayjs from "dayjs";
import { randomBytes } from "node:crypto";
import * as argon2 from "argon2";

import { RefreshTokenRepository } from "../../repository/refresh-token.repository";
import { Result } from "src/common/result/result";
import { RefreshTokenEntity } from "../../entities/refresh-token.entity";
import { isUUID } from "class-validator";

@Injectable()
export class CreateRefreshTokenService {

    constructor(
        private readonly repository: RefreshTokenRepository,
        private readonly configService: ConfigService,
    ) {}

    async execute(userId: string): Promise<Result<RefreshTokenEntity>> {
        try {
            if (!isUUID(userId)) return Result.badRequest('Id should be a UUID');

            const expirationHours = this.configService.getOrThrow<number>("REFRESH_TOKEN_EXP_HOUR");

            const refreshToken: RefreshTokenEntity = new RefreshTokenEntity();
            refreshToken.userId = userId;

            refreshToken.expiresAt = dayjs().add(expirationHours, "hours").toDate();

            const token = randomBytes(64).toString("hex");

            refreshToken.tokenHash = await argon2.hash(token);

            const created = await this.repository.create(refreshToken);

            return Result.created(created);
        } catch (error) {
            switch (error.code) {
                case '23505': {
                    const detail: string = error.detail || '';
                    if (detail.includes('uk_refresh_tokens_token_hash')) {
                        return Result.conflict(`Token hash already exists.`);
                    }

                    return Result.conflict('Data conflict detected.');
                }

                case '23502': {
                    const missingField = error.column || 'unknown field';
                    return Result.badRequest(`The field "${missingField}" cannot be null.`);
                }

                case '22001': {
                    return Result.badRequest('One or more fields exceed the maximum allowed length (e.g., 100 characters for name or 255 for email).');
                }

                case "23503": {
                    return Result.badRequest(
                        "The referenced user does not exist."
                    );
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
                    throw new InternalServerErrorException('Error creating user.');
            }
        }
        
    }

}