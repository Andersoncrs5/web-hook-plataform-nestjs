import { Injectable } from "@nestjs/common";
import {
    SQL,
    and,
    asc,
    count,
    desc,
    eq,
    isNull,
} from "drizzle-orm";

import { DatabaseService } from "src/infra/database/database.service";
import { organizations } from "src/infra/database/schema/organization.schema";

import { IOrganizationRepository } from "./iorganization.repository";
import { OrganizationEntity } from "../entities/organization.entity";

import { Page, Pageable, SortDirection } from "src/common/page/page";
import { OrganizationFilter } from "../dto/page/organization-filter.dto";
import { OrganizationMapper } from "../mapper/organization.mapper";

import {
    eqIgnoreCase,
    containsIgnoreCase,
    inArrayOptional,
    gteOptional,
    lteOptional,
} from "src/common/repository/custom.query";
import { OrganizationSort } from "../dto/page/organization-sort.dto";

@Injectable()
export class OrganizationRepository implements IOrganizationRepository {

    constructor(
        private readonly database: DatabaseService,
    ) {}

    async findById(id: string): Promise<OrganizationEntity | null> {
        const [raw] = await this.database.connection
            .select()
            .from(organizations)
            .where(
                and(
                    eq(organizations.id, id),
                    isNull(organizations.deletedAt),
                ),
            )
            .limit(1);

        return raw ? OrganizationMapper.toDomain(raw) : null;
    }

    async existsByName(name: string): Promise<boolean> {
        const [existing] = await this.database.connection
            .select({ id: organizations.id })
            .from(organizations)
            .where(
                and(
                    eqIgnoreCase(organizations.name, name),
                    isNull(organizations.deletedAt),
                ),
            )
            .limit(1);

        return existing !== undefined;
    }

    async existsBySlug(slug: string): Promise<boolean> {
        const [existing] = await this.database.connection
            .select({ id: organizations.id })
            .from(organizations)
            .where(
                and(
                    eqIgnoreCase(organizations.slug, slug),
                    isNull(organizations.deletedAt),
                ),
            )
            .limit(1);

        return existing !== undefined;
    }

    async create(organization: OrganizationEntity): Promise<OrganizationEntity> {
        const [created] = await this.database.connection
            .insert(organizations)
            .values(OrganizationMapper.toPersistence(organization))
            .returning();

        return OrganizationMapper.toDomain(created);
    }

    async update(organization: OrganizationEntity): Promise<OrganizationEntity> {
        const [updated] = await this.database.connection
            .update(organizations)
            .set({
                ...OrganizationMapper.toPersistence(organization),
                version: organization.version + 1,
                updatedAt: new Date(),
            })
            .where(eq(organizations.id, organization.id))
            .returning();

        return OrganizationMapper.toDomain(updated);
    }

    async deleteById(id: string): Promise<boolean> {
        const deleted = await this.database.connection
            .delete(organizations)
            .where(eq(organizations.id, id))
            .returning({ id: organizations.id });

        return deleted.length > 0;
    }

    async findAll(
        filter: OrganizationFilter,
        pageable: Pageable<OrganizationSort>,
    ): Promise<Page<OrganizationEntity>> {
        const conditions: SQL[] = [
            isNull(organizations.deletedAt),
        ];

        /*
         * ID
         */
        if (filter.id) {
            conditions.push(eq(organizations.id, filter.id));
        }

        /*
         * NAME
         */
        if (filter.name) {
            conditions.push(containsIgnoreCase(organizations.name, filter.name));
        }

        /*
         * SLUG
         */
        if (filter.slug) {
            conditions.push(containsIgnoreCase(organizations.slug, filter.slug));
        }

        /*
         * STATUS
         */
        const statusCondition = inArrayOptional(organizations.status, filter.status);
        if (statusCondition) {
            conditions.push(statusCondition);
        }

        /*
         * USER ID
         */
        if (filter.userId) {
            conditions.push(eq(organizations.userId, filter.userId));
        }

        /*
         * VERSION
         */
        if (filter.version !== undefined) {
            conditions.push(eq(organizations.version, filter.version));
        }

        /*
         * CREATED AT
         */
        const createdAtMinCond = gteOptional(organizations.createdAt, filter.createdAtMin);
        if (createdAtMinCond) conditions.push(createdAtMinCond);

        const createdAtMaxCond = lteOptional(organizations.createdAt, filter.createdAtMax);
        if (createdAtMaxCond) conditions.push(createdAtMaxCond);

        /*
         * UPDATED AT
         */
        const updatedAtMinCond = gteOptional(organizations.updatedAt, filter.updatedAtMin);
        if (updatedAtMinCond) conditions.push(updatedAtMinCond);

        const updatedAtMaxCond = lteOptional(organizations.updatedAt, filter.updatedAtMax);
        if (updatedAtMaxCond) conditions.push(updatedAtMaxCond);

        /*
         * SORT
         */
        const sortableColumns = {
            [OrganizationSort.ID]: organizations.id,
            [OrganizationSort.NAME]: organizations.name,
            [OrganizationSort.SLUG]: organizations.slug,
            [OrganizationSort.STATUS]: organizations.status,
            [OrganizationSort.USER_ID]: organizations.userId,
            [OrganizationSort.VERSION]: organizations.version,
            [OrganizationSort.CREATED_AT]: organizations.createdAt,
            [OrganizationSort.UPDATED_AT]: organizations.updatedAt,
        } as const;

        const sortColumn = sortableColumns[pageable.sortBy] ?? organizations.createdAt;
        const isAsc = pageable.direction === SortDirection.ASC || (pageable.direction as string) === "asc";

        /*
         * DATA
         */
        const result = await this.database.connection
            .select()
            .from(organizations)
            .where(and(...conditions))
            .orderBy(isAsc ? asc(sortColumn) : desc(sortColumn))
            .limit(pageable.size)
            .offset((pageable.page - 1) * pageable.size);

        /*
         * COUNT
         */
        const [{ totalElements }] = await this.database.connection
            .select({ totalElements: count() })
            .from(organizations)
            .where(and(...conditions));

        return new Page(
            result.map(OrganizationMapper.toDomain),
            pageable.page,
            pageable.size,
            totalElements,
        );
    }
}