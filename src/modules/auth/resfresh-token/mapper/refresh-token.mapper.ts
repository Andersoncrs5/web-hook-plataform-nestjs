import { refreshTokens } from "src/infra/database/schema/refresh.tokens.schema";
import { CreateRefreshTokenDTO } from "../dto/create-refresh-token.dto";
import { RefreshTokenEntity } from "../entities/refresh-token.entity";

type SchemaRefreshToken = typeof refreshTokens.$inferSelect;

export class RefreshTokenMapper {

    static toDomain(raw: SchemaRefreshToken): RefreshTokenEntity {

        const token = new RefreshTokenEntity();

        Object.assign(token, raw);

        return token;
    }


    static toPersistence(token: RefreshTokenEntity) {

        return {
            id: token.id,
            userId: token.userId,
            tokenHash: token.tokenHash,
            expiresAt: token.expiresAt,
            revokedAt: token.revokedAt,
            replacedByTokenId: token.replacedByTokenId,
            version: token.version,
        };
    }


    static create(dto: CreateRefreshTokenDTO): RefreshTokenEntity {

        const token = new RefreshTokenEntity();

        token.userId = dto.userId;
        token.expiresAt = dto.expiresAt;
        token.revokedAt = null;
        token.replacedByTokenId = null;
        token.version = 0;

        return token;
    }
}