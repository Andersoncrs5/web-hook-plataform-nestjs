import { BaseEntity } from "src/common/base/entity/base.entity.base";
import { RefreshTokenStatus } from "src/common/enums/refresh-token/refresh-token-status.enum";
import { refreshTokens } from "src/infra/database/schema/refresh.tokens.schema";


export type NewRefreshToken = typeof refreshTokens.$inferInsert;

export class RefreshTokenEntity extends BaseEntity {
    status: RefreshTokenStatus;
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    revokedAt: Date | null;
    replacedByTokenId: string | null;
}