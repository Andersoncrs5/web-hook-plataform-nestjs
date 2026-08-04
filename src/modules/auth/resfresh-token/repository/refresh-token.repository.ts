import { Injectable } from "@nestjs/common";
import { and, eq, gt, isNull, lt } from "drizzle-orm";

import { DatabaseService } from "src/infra/database/database.service";
import { refreshTokens } from "src/infra/database/schema/refresh.tokens.schema";

import { IRefreshTokenRepository } from "./irefresh-token.repository";
import { RefreshTokenEntity } from "../entities/refresh-token.entity";
import { RefreshTokenMapper } from "../mapper/refresh-token.mapper";
import { users } from "src/infra/database/schema/user.schema";
import { User } from "src/modules/user/entities/user.entity";
import { UserMapper } from "src/modules/user/mapper/user.mapper";

@Injectable()
export class RefreshTokenRepository implements IRefreshTokenRepository {

    constructor(
        private readonly database: DatabaseService,
    ) {}

    async deleteByIdAndCount(id: string): Promise<number> {
        const result = await this.database.connection
            .delete(refreshTokens)
            .where(eq(refreshTokens.id, id))
            .returning({ id: refreshTokens.id });

        return result.length;
    }
    
    async create(token: RefreshTokenEntity): Promise<RefreshTokenEntity> {

        const [created] = await this.database.connection
            .insert(refreshTokens)
            .values(
                RefreshTokenMapper.toPersistence(token)
            )
            .returning();


        return RefreshTokenMapper.toDomain(created);
    }

    async update(token: RefreshTokenEntity): Promise<RefreshTokenEntity> {

        const [updated] = await this.database.connection
            .update(refreshTokens)
            .set({
                ...RefreshTokenMapper.toPersistence(token),
                version: token.version + 1,
                updatedAt: new Date(),
            })
            .where(eq(refreshTokens.id, token.id))
            .returning();


        return RefreshTokenMapper.toDomain(updated);
    }

    async findById(id: string): Promise<RefreshTokenEntity | null> {

        const [token] = await this.database.connection
            .select()
            .from(refreshTokens)
            .where(eq(refreshTokens.id, id));


        return token
            ? RefreshTokenMapper.toDomain(token)
            : null;
    }

    async findByTokenHashWithUser(
        tokenHash: string,
    ): Promise<{
        refreshToken: RefreshTokenEntity;
        user: User;
    } | null> {

        const [result] = await this.database.connection
            .select({
                refreshToken: refreshTokens,
                user: users,
            })
            .from(refreshTokens)
            .innerJoin(
                users,
                eq(refreshTokens.userId, users.id),
            )
            .where(
                and(
                    eq(refreshTokens.tokenHash, tokenHash),
                    isNull(refreshTokens.revokedAt),
                    gt(refreshTokens.expiresAt, new Date()),
                ),
            );

        if (!result) {
            return null;
        }

        return {
            refreshToken: RefreshTokenMapper.toDomain(
                result.refreshToken,
            ),
            user: UserMapper.toDomain(
                result.user,
            ),
        };
    }

    async findByTokenHash(tokenHash: string): Promise<RefreshTokenEntity | null> {

        const [token] = await this.database.connection
            .select()
            .from(refreshTokens)
            .where(
                eq(refreshTokens.tokenHash, tokenHash)
            );

        return token
            ? RefreshTokenMapper.toDomain(token)
            : null;
    }

    async findActiveByUserId(userId: string): Promise<RefreshTokenEntity | null> {

        const [token] = await this.database.connection
            .select()
            .from(refreshTokens)
            .where(
                and(
                    eq(refreshTokens.userId, userId),
                    isNull(refreshTokens.revokedAt),
                    gt(refreshTokens.expiresAt, new Date()),
                )
            );


        return token
            ? RefreshTokenMapper.toDomain(token)
            : null;
    }

    async revokeAllByUserId(userId: string): Promise<number> {

        const revoked = await this.database.connection
            .update(refreshTokens)
            .set({
                revokedAt: new Date(),
                updatedAt: new Date(),
            })
            .where(
                and(
                    eq(refreshTokens.userId, userId),
                    isNull(refreshTokens.revokedAt),
                )
            )
            .returning({
                id: refreshTokens.id,
            });


        return revoked.length;
    }

    async deleteExpired(): Promise<number> {

        const deleted = await this.database.connection
            .delete(refreshTokens)
            .where(
                lt(
                    refreshTokens.expiresAt,
                    new Date()
                )
            )
            .returning({
                id: refreshTokens.id,
            });


        return deleted.length;
    }

}