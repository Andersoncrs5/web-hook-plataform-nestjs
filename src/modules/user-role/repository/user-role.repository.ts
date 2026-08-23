import { Injectable } from "@nestjs/common";
import { SQL, and, asc, count, desc, eq, gte, lte } from "drizzle-orm";

import { DatabaseService } from "src/infra/database/database.service";

import { IUserRoleRepository } from "./iuser-role.repository";
import { UserRole } from "../entities/user-role.entity";

import { Page, Pageable } from "src/common/page/page";
import { UserRoleFilter } from "../dto/user-role-filter.dto";
import { UserRoleSort } from "../dto/user-role-sort.dto";
import { UserRoleMapper } from "../mapper/user-role.mapper";
import { userRoles } from "src/infra/database/schema/user.roles.schema";
import { users } from "src/infra/database/schema/user.schema";
import { roles } from "src/infra/database/schema/roles.schema";
import { Role } from "src/modules/roles/entities/role.entity";
import { RoleMapper } from "src/modules/roles/mapper/role.mapper";

@Injectable()
export class UserRoleRepository implements IUserRoleRepository {
    constructor(
        private readonly database: DatabaseService,
    ) {}

    async findAllByUserIdJustRoleId(userId: string): Promise<string[]> {
        const rows = await this.database.connection
            .select({ id: userRoles.roleId })
            .from(userRoles)
            .where(eq(userRoles.userId, userId));

        return rows.map((row: { id: string; }) => row.id);
    }
    
    async existsByRoleIdAndUserId(roleId: string, userId: string): Promise<boolean> {
        const [existingUserRole] = await this.database.connection
            .select({ id: userRoles.id })
            .from(userRoles)
            .where(
                and(
                    eq(userRoles.roleId, roleId),
                    eq(userRoles.userId, userId)
                )
            )
            .limit(1);

        return !!existingUserRole;
    }

    async findAllRoleNamesByUserId(userId: string): Promise<string[]> {
        const rows = await this.database.connection
            .select({
                name: roles.name,
            })
            .from(userRoles)
            .innerJoin(
                roles,
                eq(userRoles.roleId, roles.id),
            )
            .where(eq(userRoles.userId, userId));

        return rows.map((row) => row.name);
    }

    async findAllRolesByUserId(userId: string): Promise<Role[]> {
        const rows = await this.database.connection
            .select({
                id: roles.id,
                name: roles.name,
                description: roles.description,
                isActive: roles.isActive,
            })
            .from(userRoles)
            .innerJoin(
                roles,
                eq(userRoles.roleId, roles.id),
            )
            .where(eq(userRoles.userId, userId));

        return rows.map(RoleMapper.toDomain);
    }

    async findById(id: string): Promise<UserRole | null> {
        const [userRole] = await this.database.connection
            .select()
            .from(userRoles)
            .where(eq(userRoles.id, id));

        return userRole ? UserRoleMapper.toDomain(userRole) : null;
    }

    async create(userRole: UserRole): Promise<UserRole> {
        const [created] = await this.database.connection
            .insert(userRoles)
            .values(UserRoleMapper.toPersistence(userRole))
            .returning();

        return UserRoleMapper.toDomain(created);
    }

    async update(userRole: UserRole): Promise<UserRole> {
        const [updated] = await this.database.connection
            .update(userRoles)
            .set({
                ...UserRoleMapper.toPersistence(userRole),
                version: userRole.version + 1,
                updatedAt: new Date(),
            })
            .where(eq(userRoles.id, userRole.id))
            .returning();

        return UserRoleMapper.toDomain(updated);
    }

    async deleteById(id: string): Promise<boolean> {
        const deleted = await this.database.connection
            .delete(userRoles)
            .where(eq(userRoles.id, id))
            .returning({
                id: userRoles.id,
            });

        return deleted.length > 0;
    }

    async findAll(
        filter: UserRoleFilter,
        pageable: Pageable<UserRoleSort>,
    ): Promise<Page<UserRole>> {
        const conditions: SQL[] = [];

        if (filter.id) conditions.push(eq(userRoles.id, filter.id));
        
        if (filter.userId) conditions.push(eq(userRoles.userId, filter.userId));
        
        if (filter.roleId) conditions.push(eq(userRoles.roleId, filter.roleId));
        
        if (filter.version !== undefined) conditions.push(eq(userRoles.version, filter.version));
        
        const sortableColumns = {
            id: userRoles.id,
            userId: userRoles.userId,
            roleId: userRoles.roleId,
            createdAt: userRoles.createdAt,
            updatedAt: userRoles.updatedAt,
        } as const;

        const sortColumn = sortableColumns[pageable.sortBy] ?? userRoles.createdAt;
        const whereCondition = conditions.length ? and(...conditions) : undefined;

        let query = this.database.connection
            .select({
                id: userRoles.id,
                userId: userRoles.userId,
                roleId: userRoles.roleId,
                version: userRoles.version,
                createdAt: userRoles.createdAt,
                updatedAt: userRoles.updatedAt,
                deletedAt: userRoles.deletedAt,
            })
            .from(userRoles)
            .$dynamic();

        if (filter.loadUser) {
            query = query.leftJoin(users, eq(userRoles.userId, users.id));
        }

        if (filter.loadRole) {
            query = query.leftJoin(roles, eq(userRoles.roleId, roles.id));
        }

        const rawResult = await query
            .where(whereCondition)
            .orderBy(
                pageable.direction === "asc"? asc(sortColumn) : desc(sortColumn)
            )
            .limit(pageable.size)
            .offset((pageable.page - 1) * pageable.size);

        const [{ totalElements }] = await this.database.connection
            .select({ totalElements: count() })
            .from(userRoles)
            .where(whereCondition);

        const mappedContent = rawResult.map((row: any) => {
            const baseData = row.user_roles ? row.user_roles : row;
            
            const userRole = UserRoleMapper.toDomain(baseData);

            if (filter.loadUser && row.users) {
                userRole.user = row.users; 
            }

            if (filter.loadRole && row.roles) {
                userRole.role = row.roles;
            }

            return userRole;
        });

        return new Page(
            mappedContent,
            pageable.page,
            pageable.size,
            totalElements,
        );
    }
}