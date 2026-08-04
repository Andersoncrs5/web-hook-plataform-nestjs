import { User } from "src/modules/user/entities/user.entity";
import { RefreshTokenEntity } from "../entities/refresh-token.entity";

export abstract class IRefreshTokenRepository {

    abstract create(token: RefreshTokenEntity): Promise<RefreshTokenEntity>;

    abstract update(token: RefreshTokenEntity): Promise<RefreshTokenEntity>;

    abstract findById(id: string): Promise<RefreshTokenEntity | null>;

    abstract findByTokenHash(tokenHash: string): Promise<RefreshTokenEntity | null>;

    abstract findActiveByUserId(userId: string): Promise<RefreshTokenEntity | null>;

    abstract revokeAllByUserId(userId: string): Promise<number>;

    abstract deleteExpired(): Promise<number>;

    abstract deleteByIdAndCount(id: string): Promise<number>;

    abstract findByTokenHashWithUser(tokenHash: string): Promise<{ refreshToken: RefreshTokenEntity; user: User;} | null>
}