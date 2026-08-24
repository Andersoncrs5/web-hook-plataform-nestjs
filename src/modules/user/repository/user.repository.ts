import { Injectable } from "@nestjs/common";
import {
    and,
    asc,
    count,
    desc,
    eq,
    gte,
    lte,
    SQL,
} from "drizzle-orm";

import { DatabaseService } from "src/infra/database/database.service";
import { users } from "src/infra/database/schema/user.schema";
import { IUserRepository } from "./iuser.repository";
import { User } from "../entities/user.entity";
import { UserMapper } from "../mapper/user.mapper";
import { UserFilter } from "../dto/user-filter.filter";
import { Page, Pageable } from "src/common/page/page";
import { UserSort } from "../dto/user-sort.page";
import {
    containsIgnoreCase,
    eqIgnoreCase,
} from "src/common/repository/custom.query";

@Injectable()
export class UserRepository implements IUserRepository {

    constructor(
        private readonly database: DatabaseService,
    ) {}

    async findByEmail(email: string): Promise<User | null> {
        const [rawUser] = await this.database.connection
            .select()
            .from(users)
            .where(
                eqIgnoreCase(users.email, email),
            )
            .limit(1);

        return rawUser
            ? UserMapper.toDomain(rawUser)
            : null;
    }

    async findAll(
        filter: UserFilter,
        pageable: Pageable<UserSort>,
    ): Promise<Page<User>> {

        const conditions: SQL[] = [];

        if (filter.id) {
            conditions.push(
                eq(users.id, filter.id),
            );
        }

        if (filter.name) {
            conditions.push(
                containsIgnoreCase(
                    users.name,
                    filter.name,
                ),
            );
        }

        if (filter.fullName) {
            conditions.push(
                containsIgnoreCase(
                    users.fullName,
                    filter.fullName,
                ),
            );
        }

        if (filter.email) {
            conditions.push(
                containsIgnoreCase(
                    users.email,
                    filter.email,
                ),
            );
        }

        if (filter.status) {
            conditions.push(
                eq(users.status, filter.status),
            );
        }

        if (filter.createdAtMin) {
            conditions.push(
                gte(
                    users.createdAt,
                    filter.createdAtMin,
                ),
            );
        }

        if (filter.createdAtMax) {
            conditions.push(
                lte(
                    users.createdAt,
                    filter.createdAtMax,
                ),
            );
        }

        if (filter.updatedAtMin) {
            conditions.push(
                gte(
                    users.updatedAt,
                    filter.updatedAtMin,
                ),
            );
        }

        if (filter.updatedAtMax) {
            conditions.push(
                lte(
                    users.updatedAt,
                    filter.updatedAtMax,
                ),
            );
        }

        const sortableColumns = {
            id: users.id,
            name: users.name,
            fullName: users.fullName,
            email: users.email,
            status: users.status,
            createdAt: users.createdAt,
            updatedAt: users.updatedAt,
        } as const;

        const sortColumn =
            sortableColumns[pageable.sortBy]
            ?? users.createdAt;

        const where =
            conditions.length > 0
                ? and(...conditions)
                : undefined;

        const rawResults = await this.database.connection
            .select()
            .from(users)
            .where(where)
            .orderBy(
                pageable.direction === "asc"
                    ? asc(sortColumn)
                    : desc(sortColumn),
            )
            .limit(pageable.size)
            .offset(
                (pageable.page - 1) * pageable.size,
            );

        const result = rawResults.map(
            UserMapper.toDomain,
        );

        const [{ totalElements }] =
            await this.database.connection
                .select({
                    totalElements: count(),
                })
                .from(users)
                .where(where);

        return new Page(
            result,
            pageable.page,
            pageable.size,
            Number(totalElements),
        );
    }

    async findById(
        id: string,
    ): Promise<User | null> {

        const [rawUser] =
            await this.database.connection
                .select()
                .from(users)
                .where(
                    eq(users.id, id),
                )
                .limit(1);

        return rawUser
            ? UserMapper.toDomain(rawUser)
            : null;
    }

    async existsById(
        id: string,
    ): Promise<boolean> {

        const [user] =
            await this.database.connection
                .select({
                    id: users.id,
                })
                .from(users)
                .where(
                    eq(users.id, id),
                )
                .limit(1);

        return user !== undefined;
    }

    async create(user: User): Promise<User> {

        const [created] =
            await this.database.connection
                .insert(users)
                .values(
                    UserMapper.toPersistence(user),
                )
                .returning();

        return UserMapper.toDomain(created);
    }

    async update(user: User): Promise<User> {

        const [updated] =
            await this.database.connection
                .update(users)
                .set({
                    ...UserMapper.toPersistence(user),
                    version: user.version + 1,
                    updatedAt: new Date(),
                })
                .where(
                    eq(users.id, user.id),
                )
                .returning();

        return UserMapper.toDomain(updated);
    }

    async deleteById(
        id: string,
    ): Promise<boolean> {

        const deleted =
            await this.database.connection
                .delete(users)
                .where(
                    eq(users.id, id),
                )
                .returning({
                    id: users.id,
                });

        return deleted.length > 0;
    }

    async deleteByIdAndCount(
        id: string,
    ): Promise<number> {

        const deleted =
            await this.database.connection
                .delete(users)
                .where(
                    eq(users.id, id),
                )
                .returning({
                    id: users.id,
                });

        return deleted.length;
    }
}