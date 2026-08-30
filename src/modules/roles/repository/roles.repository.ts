import { Injectable } from "@nestjs/common";
import {
    SQL,
    and,
    asc,
    count,
    desc,
    eq,
    gte,
    lte,
    inArray,
} from "drizzle-orm";

import { DatabaseService } from "src/infra/database/database.service";
import { roles } from "src/infra/database/schema/roles.schema";

import { IRoleRepository } from "./iroles.repository";
import { Role } from "../entities/role.entity";

import { Page, Pageable } from "src/common/page/page";
import { RoleFilter } from "../dto/role-filter.dto";
import { RoleSort } from "../dto/role-sort.dto";
import { RoleMapper } from "../mapper/role.mapper";

import {
    eqIgnoreCase,
    containsIgnoreCase,
} from "src/common/repository/custom.query";

@Injectable()
export class RoleRepository implements IRoleRepository {

    constructor(
        private readonly database: DatabaseService,
    ) {}


    async create(
        role: Role,
    ): Promise<Role> {

        const [created] =
            await this.database.connection
                .insert(roles)
                .values(
                    RoleMapper.toPersistence(role),
                )
                .returning();

        return RoleMapper.toDomain(created);
    }


    async findByName(
        name: string,
    ): Promise<Role | null> {

        const [role] =
            await this.database.connection
                .select()
                .from(roles)
                .where(eqIgnoreCase(roles.name, name))
                .limit(1);

        return role
            ? RoleMapper.toDomain(role)
            : null;
    }


    async findByIds(
        ids: string[],
        limit: number = 50,
    ): Promise<Role[]> {

        if (!ids?.length) {
            return [];
        }

        const result = await this.database.connection
            .select()
            .from(roles)
            .where(inArray(roles.id, ids))
            .limit(limit);

        return result.map(RoleMapper.toDomain);
    }

    async findAll(
        filter: RoleFilter,
        pageable: Pageable<RoleSort>,
    ): Promise<Page<Role>> {

        const conditions: SQL[] = [];

        /*
         * ID
         */
        if (filter.id) {
            conditions.push(
                eq(roles.id, filter.id),
            );
        }

        /*
         * NAME
         *
         * Case-insensitive partial match.
         *
         * "admin" matches:
         * "Admin"
         * "ADMIN"
         * "administrator"
         */
        if (filter.name) {
            conditions.push(
                containsIgnoreCase(
                    roles.name,
                    filter.name,
                ),
            );
        }

        /*
         * DESCRIPTION
         */
        if (filter.description) {
            conditions.push(
                containsIgnoreCase(
                    roles.description,
                    filter.description,
                ),
            );
        }

        /*
         * ACTIVE
         */
        if (filter.isActive !== undefined) {
            conditions.push(
                eq(
                    roles.isActive,
                    filter.isActive,
                ),
            );
        }

        /*
         * VERSION
         */
        if (filter.version !== undefined) {
            conditions.push(
                eq(
                    roles.version,
                    filter.version,
                ),
            );
        }

        /*
         * CREATED AT
         */
        if (filter.createdAtMin) {
            conditions.push(
                gte(
                    roles.createdAt,
                    filter.createdAtMin,
                ),
            );
        }

        if (filter.createdAtMax) {
            conditions.push(
                lte(
                    roles.createdAt,
                    filter.createdAtMax,
                ),
            );
        }

        /*
         * UPDATED AT
         */
        if (filter.updatedAtMin) {
            conditions.push(
                gte(
                    roles.updatedAt,
                    filter.updatedAtMin,
                ),
            );
        }

        if (filter.updatedAtMax) {
            conditions.push(
                lte(
                    roles.updatedAt,
                    filter.updatedAtMax,
                ),
            );
        }

        /*
         * SORT
         */
        const sortableColumns = {
            id: roles.id,
            name: roles.name,
            description: roles.description,
            isActive: roles.isActive,
            version: roles.version,
            createdAt: roles.createdAt,
            updatedAt: roles.updatedAt,
        } as const;

        const sortColumn =
            sortableColumns[pageable.sortBy]
            ?? roles.createdAt;

        /*
         * DATA
         */
        const result = await this.database.connection
            .select()
            .from(roles)
            .where(
                conditions.length > 0
                    ? and(...conditions)
                    : undefined,
            )
            .orderBy(
                pageable.direction === "asc"
                    ? asc(sortColumn)
                    : desc(sortColumn),
            )
            .limit(pageable.size)
            .offset(
                (pageable.page - 1) * pageable.size,
            );

        /*
         * COUNT
         */
        const [{ totalElements }] =
            await this.database.connection
                .select({
                    totalElements: count(),
                })
                .from(roles)
                .where(
                    conditions.length > 0
                        ? and(...conditions)
                        : undefined,
                );

        return new Page(
            result.map(RoleMapper.toDomain),
            pageable.page,
            pageable.size,
            totalElements,
        );
    }

    async findById(
        id: string,
    ): Promise<Role | null> {

        const [role] =
            await this.database.connection
                .select()
                .from(roles)
                .where(eq(roles.id, id))
                .limit(1);

        return role
            ? RoleMapper.toDomain(role)
            : null;
    }

    async update(
        role: Role,
    ): Promise<Role> {

        const [updated] =
            await this.database.connection
                .update(roles)
                .set({
                    ...RoleMapper.toPersistence(role),
                    version: role.version + 1,
                    updatedAt: new Date(),
                })
                .where(
                    eq(roles.id, role.id),
                )
                .returning();

        return RoleMapper.toDomain(updated);
    }

    async deleteById(
        id: string,
    ): Promise<boolean> {

        const deleted =
            await this.database.connection
                .delete(roles)
                .where(eq(roles.id, id))
                .returning({
                    id: roles.id,
                });

        return deleted.length > 0;
    }

    async existsByName(
        name: string,
    ): Promise<boolean> {

        const [existingRole] =
            await this.database.connection
                .select({
                    id: roles.id,
                })
                .from(roles)
                .where(
                    eqIgnoreCase(
                        roles.name,
                        name,
                    ),
                )
                .limit(1);

        return existingRole !== undefined;
    }
}