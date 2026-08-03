import { RefreshToken } from "../entities/refresh-token.entity";

export abstract class IRefreshTokenRepository {

    abstract create(token: RefreshToken): Promise<RefreshToken>;

    abstract update(token: RefreshToken): Promise<RefreshToken>;

    abstract findById(id: string): Promise<RefreshToken | null>;

    abstract findByTokenHash(tokenHash: string): Promise<RefreshToken | null>;

    abstract findActiveByUserId(userId: string): Promise<RefreshToken | null>;

    abstract revokeAllByUserId(userId: string): Promise<number>;

    abstract deleteExpired(): Promise<number>;

    abstract deleteByIdAndCount(id: string): Promise<number>;
}