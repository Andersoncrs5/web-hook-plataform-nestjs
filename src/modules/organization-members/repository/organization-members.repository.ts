import { Injectable } from '@nestjs/common';
import { SQL, and, asc, desc, eq, gte, inArray, isNull, lte, sql } from 'drizzle-orm';

import { DatabaseService } from 'src/infra/database/database.service';
import { BaseRepository } from 'src/common/base/repository/base.repository';
import { Pageable, Page, SortDirection } from 'src/common/page/page';

import { organizationMembers } from 'src/infra/database/schema/organization.members.schema';
import { OrganizationMemberEntity } from '../entities/organization-member.entity';
import { OrganizationMemberMapper } from '../mapper/organization-member.mapper';
import { IOrganizationMemberRepository } from './iorganization-members.repository';
import { OrganizationMemberFilter } from '../dto/filter/organization-member-filter.dto';
import { OrganizationMemberSort } from '../dto/filter/organization-member-sort.dto';

@Injectable()
export class OrganizationMemberRepository
  extends BaseRepository<OrganizationMemberEntity, typeof organizationMembers>
  implements IOrganizationMemberRepository
{
  constructor(database: DatabaseService) {
    super(
      database,
      organizationMembers,
      OrganizationMemberMapper.toDomain,
      OrganizationMemberMapper.toPersistence,
    );
  }

  async findAll(
    filter: OrganizationMemberFilter,
    pageable: Pageable<OrganizationMemberSort>,
  ): Promise<Page<OrganizationMemberEntity>> {
    const page = pageable.page ?? 1;
    const size = pageable.size ?? 30;
    const offset = (page - 1) * size;

    const sortBy = pageable.sortBy ?? OrganizationMemberSort.CREATED_AT;
    const direction = pageable.direction ?? SortDirection.DESC;

    /*
     * FILTERS
     */
    const conditions: SQL[] = [isNull(organizationMembers.deletedAt)];

    if (filter.id != null) {
      conditions.push(eq(organizationMembers.id, filter.id));
    }

    if (filter.organizationId != null) {
      conditions.push(eq(organizationMembers.organizationId, filter.organizationId));
    }

    if (filter.userId != null) {
      conditions.push(eq(organizationMembers.userId, filter.userId));
    }

    if (filter.roleId != null) {
      conditions.push(eq(organizationMembers.roleId, filter.roleId));
    }

    if (filter.status?.length) {
      conditions.push(inArray(organizationMembers.status, filter.status));
    }

    if (filter.version != null) {
      conditions.push(eq(organizationMembers.version, filter.version));
    }

    if (filter.createdAtMin != null) {
      conditions.push(gte(organizationMembers.createdAt, filter.createdAtMin));
    }

    if (filter.createdAtMax != null) {
      conditions.push(lte(organizationMembers.createdAt, filter.createdAtMax));
    }

    if (filter.updatedAtMin != null) {
      conditions.push(gte(organizationMembers.updatedAt, filter.updatedAtMin));
    }

    if (filter.updatedAtMax != null) {
      conditions.push(lte(organizationMembers.updatedAt, filter.updatedAtMax));
    }

    const where = and(...conditions);

    /*
     * SORT
     */
    const sortableColumns = {
      [OrganizationMemberSort.ID]: organizationMembers.id,
      [OrganizationMemberSort.ORGANIZATION_ID]: organizationMembers.organizationId,
      [OrganizationMemberSort.USER_ID]: organizationMembers.userId,
      [OrganizationMemberSort.ROLE_ID]: organizationMembers.roleId,
      [OrganizationMemberSort.STATUS]: organizationMembers.status,
      [OrganizationMemberSort.VERSION]: organizationMembers.version,
      [OrganizationMemberSort.CREATED_AT]: organizationMembers.createdAt,
      [OrganizationMemberSort.UPDATED_AT]: organizationMembers.updatedAt,
    } as const;

    const sortColumn = sortableColumns[sortBy] ?? organizationMembers.createdAt;

    const orderBy = direction === SortDirection.ASC ? asc(sortColumn) : desc(sortColumn);

    /*
     * DATA
     */
    const result = await this.database.connection
      .select({
        id: organizationMembers.id,
        organizationId: organizationMembers.organizationId,
        userId: organizationMembers.userId,
        roleId: organizationMembers.roleId,
        status: organizationMembers.status,
        version: organizationMembers.version,
        createdAt: organizationMembers.createdAt,
        updatedAt: organizationMembers.updatedAt,
        deletedAt: organizationMembers.deletedAt,
      })
      .from(organizationMembers)
      .where(where)
      .orderBy(orderBy)
      .limit(size)
      .offset(offset);

    /*
     * COUNT
     */
    const [countResult] = await this.database.connection
      .select({
        totalElements: sql<number>`COUNT(*)::int`,
      })
      .from(organizationMembers)
      .where(where);

    const totalElements = countResult?.totalElements ?? 0;

    return new Page(result.map(OrganizationMemberMapper.toDomain), page, size, totalElements);
  }

  async existsByOrganizationIdAndUserId(organizationId: string, userId: string): Promise<boolean> {
    const [existing] = await this.database.connection
      .select({ id: organizationMembers.id })
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.organizationId, organizationId),
          eq(organizationMembers.userId, userId),
          isNull(organizationMembers.deletedAt),
        ),
      )
      .limit(1);

    return existing !== undefined;
  }

  async existsByOrganizationIdAndRoleId(organizationId: string, roleId: string): Promise<boolean> {
    const [existing] = await this.database.connection
      .select({ id: organizationMembers.id })
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.organizationId, organizationId),
          eq(organizationMembers.roleId, roleId),
          isNull(organizationMembers.deletedAt),
        ),
      )
      .limit(1);

    return existing !== undefined;
  }
}
