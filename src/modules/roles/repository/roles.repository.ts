import { Injectable } from "@nestjs/common";
import {
    SQL,
    and,
    asc,
    count,
    desc,
    eq,
    gte,
    ilike,
    lte,
} from "drizzle-orm";

import { DatabaseService } from "src/infra/database/database.service";
import { roles } from "src/infra/database/schema/roles.schemas";

import { IRoleRepository } from "./iroles.repository";
import { Role } from "../entities/role.entity";

import { Page, Pageable } from "src/common/page/page";
import { RoleFilter } from "../dto/role-filter.dto";
import { RoleSort } from "../dto/role-sort.dto";
import { RoleMapper } from "../mapper/role.mapper";

@Injectable()
export class RoleRepository implements IRoleRepository {

    constructor(
        private readonly database: DatabaseService,
    ) {}

    async findAll(
        filter: RoleFilter,
        pageable: Pageable<RoleSort>,
    ): Promise<Page<Role>> {

        const conditions: SQL[] = [];

        if (filter.id) {
            conditions.push(eq(roles.id, filter.id));
        }

        if (filter.name) {
            conditions.push(ilike(roles.name, `%${filter.name}%`));
        }

        if (filter.description) {
            conditions.push(
                ilike(roles.description, `%${filter.description}%`)
            );
        }

        if (filter.isActive !== undefined) {
            conditions.push(eq(roles.isActive, filter.isActive));
        }

        if (filter.version !== undefined) {
            conditions.push(eq(roles.version, filter.version));
        }

        if (filter.createdAtMin) {
            conditions.push(gte(roles.createdAt, filter.createdAtMin));
        }

        if (filter.createdAtMax) {
            conditions.push(lte(roles.createdAt, filter.createdAtMax));
        }

        if (filter.updatedAtMin) {
            conditions.push(gte(roles.updatedAt, filter.updatedAtMin));
        }

        if (filter.updatedAtMax) {
            conditions.push(lte(roles.updatedAt, filter.updatedAtMax));
        }

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
            sortableColumns[pageable.sortBy] ?? roles.createdAt;

        const result = await this.database.connection
            .select()
            .from(roles)
            .where(
                conditions.length
                    ? and(...conditions)
                    : undefined
            )
            .orderBy(
                pageable.direction === "asc"
                    ? asc(sortColumn)
                    : desc(sortColumn)
            )
            .limit(pageable.size)
            .offset((pageable.page - 1) * pageable.size);

        const [{ totalElements }] = await this.database.connection
            .select({
                totalElements: count(),
            })
            .from(roles)
            .where(
                conditions.length
                    ? and(...conditions)
                    : undefined
            );

        return new Page(
            result.map(RoleMapper.toDomain),
            pageable.page,
            pageable.size,
            totalElements,
        );
    }

    async findById(id: string): Promise<Role | null> {

        const [role] = await this.database.connection
            .select()
            .from(roles)
            .where(eq(roles.id, id));

        return role ? RoleMapper.toDomain(role) : null;
    }

    async create(role: Role): Promise<Role> {

        const [created] = await this.database.connection
            .insert(roles)
            .values(RoleMapper.toPersistence(role))
            .returning();

        return RoleMapper.toDomain(created);
    }

    async update(role: Role): Promise<Role> {

        const [updated] = await this.database.connection
            .update(roles)
            .set({
                ...RoleMapper.toPersistence(role),
                version: role.version + 1,
                updatedAt: new Date(),
            })
            .where(eq(roles.id, role.id))
            .returning();

        return RoleMapper.toDomain(updated);
    }

    async deleteById(id: string): Promise<boolean> {

        const deleted = await this.database.connection
            .delete(roles)
            .where(eq(roles.id, id))
            .returning({
                id: roles.id,
            });

        return deleted.length > 0;
    }

    async existsByName(name: string): Promise<boolean> {
        const [existingRole] = await this.database.connection
            .select({ id: roles.id }) 
            .from(roles)
            .where(eq(roles.name, name))
            .limit(1); 

        return !!existingRole;
    }
    
}