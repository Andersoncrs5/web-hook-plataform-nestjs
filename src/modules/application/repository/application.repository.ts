import { Injectable } from '@nestjs/common';
import {
  SQL,
  and,
  asc,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  isNull,
  lte,
  sql,
} from 'drizzle-orm';

import { DatabaseService } from 'src/infra/database/database.service';
import { applications } from 'src/infra/database/schema/applications.schema';

import { IApplicationRepository } from './iapplication.repository';
import { ApplicationEntity } from '../entities/application.entity';
import { ApplicationMapper } from '../mapper/application.mapper';
import { eqIgnoreCase } from 'src/common/repository/custom.query';
import { BaseRepository } from 'src/common/base/repository/base.repository';
import { Pageable, Page, SortDirection } from 'src/common/page/page';
import { ApplicationFilterDto } from '../dto/filter/application-filter.dto';
import { ApplicationSort } from '../dto/filter/application-sort.dto';

@Injectable()
export class ApplicationRepository
  extends BaseRepository<ApplicationEntity, typeof applications>
  implements IApplicationRepository
{
  constructor(database: DatabaseService) {
    super(
      database,
      applications,
      ApplicationMapper.toDomain,
      ApplicationMapper.toPersistence,
    );
  }

  async findAll(
    filter: ApplicationFilterDto,
    pageable: Pageable<ApplicationSort>,
  ): Promise<Page<ApplicationEntity>> {
    const page = pageable.page ?? 1;
    const size = pageable.size ?? 30;
    const offset = (page - 1) * size;

    const sortBy = pageable.sortBy ?? ApplicationSort.CREATED_AT;
    const direction = pageable.direction ?? SortDirection.DESC;

    /*
     * FILTERS
     */
    const conditions: SQL[] = [isNull(applications.deletedAt)];

    if (filter.id != null) {
      conditions.push(eq(applications.id, filter.id));
    }

    if (filter.organizationId != null) {
      conditions.push(eq(applications.organizationId, filter.organizationId));
    }

    if (filter.createdBy != null) {
      conditions.push(eq(applications.createdBy, filter.createdBy));
    }

    if (filter.name != null) {
      conditions.push(ilike(applications.name, `%${filter.name}%`));
    }

    if (filter.slug != null) {
      conditions.push(ilike(applications.slug, `%${filter.slug}%`));
    }

    if (filter.type?.length) {
      conditions.push(inArray(applications.type, filter.type));
    }

    if (filter.environment?.length) {
      conditions.push(inArray(applications.environment, filter.environment));
    }

    if (filter.status?.length) {
      conditions.push(inArray(applications.status, filter.status));
    }

    if (filter.rateLimitMin != null) {
      conditions.push(gte(applications.rateLimit, filter.rateLimitMin));
    }

    if (filter.rateLimitMax != null) {
      conditions.push(lte(applications.rateLimit, filter.rateLimitMax));
    }

    if (filter.version != null) {
      conditions.push(eq(applications.version, filter.version));
    }

    if (filter.createdAtMin != null) {
      conditions.push(gte(applications.createdAt, filter.createdAtMin));
    }

    if (filter.createdAtMax != null) {
      conditions.push(lte(applications.createdAt, filter.createdAtMax));
    }

    if (filter.updatedAtMin != null) {
      conditions.push(gte(applications.updatedAt, filter.updatedAtMin));
    }

    if (filter.updatedAtMax != null) {
      conditions.push(lte(applications.updatedAt, filter.updatedAtMax));
    }

    const where = and(...conditions);

    /*
     * SORT
     */
    const sortableColumns = {
      [ApplicationSort.ID]: applications.id,
      [ApplicationSort.NAME]: applications.name,
      [ApplicationSort.DESCRIPTION]: applications.description,
      [ApplicationSort.SLUG]: applications.slug,
      [ApplicationSort.STATUS]: applications.status,
      [ApplicationSort.CREATED_BY]: applications.createdBy,
      [ApplicationSort.ORGANIZATION_ID]: applications.organizationId,
      [ApplicationSort.TYPE]: applications.type,
      [ApplicationSort.ENVIRONMENT]: applications.environment,
      [ApplicationSort.LOGO_URL]: applications.logoUrl,
      [ApplicationSort.HOMEPAGE_URL]: applications.homepageUrl,
      [ApplicationSort.METADATA]: applications.metadata,
      [ApplicationSort.RATE_LIMIT]: applications.rateLimit,
      [ApplicationSort.VERSION]: applications.version,
      [ApplicationSort.CREATED_AT]: applications.createdAt,
      [ApplicationSort.UPDATED_AT]: applications.updatedAt,
    } as const;

    const sortColumn = sortableColumns[sortBy] ?? applications.createdAt;

    const orderBy =
      direction === SortDirection.ASC ? asc(sortColumn) : desc(sortColumn);

    /*
     * DATA
     */
    const result = await this.database.connection
      .select({
        id: applications.id,
        organizationId: applications.organizationId,
        createdBy: applications.createdBy,
        name: applications.name,
        slug: applications.slug,
        type: applications.type,
        environment: applications.environment,
        status: applications.status,
        logoUrl: applications.logoUrl,
        homepageUrl: applications.homepageUrl,
        description: applications.description,
        metadata: applications.metadata,
        rateLimit: applications.rateLimit,
        version: applications.version,
        createdAt: applications.createdAt,
        updatedAt: applications.updatedAt,
        deletedAt: applications.deletedAt,
      })
      .from(applications)
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
      .from(applications)
      .where(where);

    const totalElements = countResult?.totalElements ?? 0;

    return new Page(
      result.map(ApplicationMapper.toDomain),
      page,
      size,
      totalElements,
    );
  }

  async existsByName(name: string): Promise<boolean> {
    const [existing] = await this.database.connection
      .select({ id: applications.id })
      .from(applications)
      .where(
        and(
          eqIgnoreCase(applications.name, name),
          isNull(applications.deletedAt),
        ),
      )
      .limit(1);

    return existing !== undefined;
  }

  async existsBySlug(slug: string): Promise<boolean> {
    const [existing] = await this.database.connection
      .select({ id: applications.id })
      .from(applications)
      .where(
        and(
          eqIgnoreCase(applications.slug, slug),
          isNull(applications.deletedAt),
        ),
      )
      .limit(1);

    return existing !== undefined;
  }
}
