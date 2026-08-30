import { Injectable } from '@nestjs/common';
import { SQL, and, asc, desc, eq, isNull, sql } from 'drizzle-orm';

import { DatabaseService } from 'src/infra/database/database.service';
import { applications } from 'src/infra/database/schema/applications.schema';

import { IApplicationRepository } from './iapplication.repository';
import { ApplicationEntity } from '../entities/application.entity';
import { ApplicationMapper } from '../mapper/application.mapper';
import {
  containsIgnoreCase,
  eqIgnoreCase,
  gteOptional,
  inArrayOptional,
  lteOptional,
} from 'src/common/repository/custom.query';
import { BaseRepository } from 'src/common/base/repository/base.repository';
import { Pageable, Page, SortDirection } from 'src/common/page/page';
import { ApplicationFilterDto } from '../dto/filter/application-filter.dto';
import { ApplicationSort } from '../dto/filter/application-sort.dto';
import { count } from 'console';

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
    const sortBy = pageable.sortBy ?? ApplicationSort.CREATED_AT;
    const direction = pageable.direction ?? SortDirection.DESC;

    const offset = (page - 1) * size;

    /*
     * WHERE
     */
    const conditions: SQL[] = [sql`deleted_at IS NULL`];

    /*
     * ID
     */
    if (filter.id != null) {
      conditions.push(sql`id = ${filter.id}`);
    }

    /*
     * ORGANIZATION ID
     */
    if (filter.organizationId != null) {
      conditions.push(sql`organization_id = ${filter.organizationId}`);
    }

    /*
     * CREATED BY
     */
    if (filter.createdBy != null) {
      conditions.push(sql`created_by = ${filter.createdBy}`);
    }

    /*
     * NAME
     */
    if (filter.name != null) {
      conditions.push(sql`name ILIKE ${`%${filter.name}%`}`);
    }

    /*
     * SLUG
     */
    if (filter.slug != null) {
      conditions.push(sql`slug ILIKE ${`%${filter.slug}%`}`);
    }

    /*
     * TYPE
     */
    if (filter.type?.length) {
      conditions.push(
        sql`type IN (${sql.join(
          filter.type.map((value) => sql`${value}`),
          sql`, `,
        )})`,
      );
    }

    /*
     * ENVIRONMENT
     */
    if (filter.environment?.length) {
      conditions.push(
        sql`environment IN (${sql.join(
          filter.environment.map((value) => sql`${value}`),
          sql`, `,
        )})`,
      );
    }

    /*
     * STATUS
     */
    if (filter.status?.length) {
      conditions.push(
        sql`status IN (${sql.join(
          filter.status.map((value) => sql`${value}`),
          sql`, `,
        )})`,
      );
    }

    /*
     * RATE LIMIT MIN
     */
    if (filter.rateLimitMin != null) {
      conditions.push(sql`rate_limit >= ${filter.rateLimitMin}`);
    }

    /*
     * RATE LIMIT MAX
     */
    if (filter.rateLimitMax != null) {
      conditions.push(sql`rate_limit <= ${filter.rateLimitMax}`);
    }

    /*
     * VERSION
     */
    if (filter.version != null) {
      conditions.push(sql`version = ${filter.version}`);
    }

    /*
     * CREATED AT MIN
     */
    if (filter.createdAtMin != null) {
      conditions.push(sql`created_at >= ${filter.createdAtMin}`);
    }

    /*
     * CREATED AT MAX
     */
    if (filter.createdAtMax != null) {
      conditions.push(sql`created_at <= ${filter.createdAtMax}`);
    }

    /*
     * UPDATED AT MIN
     */
    if (filter.updatedAtMin != null) {
      conditions.push(sql`updated_at >= ${filter.updatedAtMin}`);
    }

    /*
     * UPDATED AT MAX
     */
    if (filter.updatedAtMax != null) {
      conditions.push(sql`updated_at <= ${filter.updatedAtMax}`);
    }

    /*
     * WHERE SQL
     */
    const whereSql = sql.join(conditions, sql` AND `);

    /*
     * SORT
     *
     * Nunca coloque o valor recebido diretamente no SQL.
     * Use whitelist.
     */
    const sortableColumns: Record<ApplicationSort, SQL> = {
      [ApplicationSort.ID]: sql`id`,

      [ApplicationSort.NAME]: sql`name`,
      [ApplicationSort.DESCRIPTION]: sql`description`,
      [ApplicationSort.SLUG]: sql`slug`,

      [ApplicationSort.STATUS]: sql`status`,
      [ApplicationSort.CREATED_BY]: sql`created_by`,
      [ApplicationSort.ORGANIZATION_ID]: sql`organization_id`,

      [ApplicationSort.TYPE]: sql`type`,
      [ApplicationSort.ENVIRONMENT]: sql`environment`,

      [ApplicationSort.LOGO_URL]: sql`logo_url`,
      [ApplicationSort.HOMEPAGE_URL]: sql`homepage_url`,
      [ApplicationSort.METADATA]: sql`metadata`,
      [ApplicationSort.RATE_LIMIT]: sql`rate_limit`,

      [ApplicationSort.VERSION]: sql`version`,
      [ApplicationSort.CREATED_AT]: sql`created_at`,
      [ApplicationSort.UPDATED_AT]: sql`updated_at`,
    };

    const sortColumn =
      sortableColumns[sortBy] ?? sortableColumns[ApplicationSort.CREATED_AT];

    const orderDirection =
      direction === SortDirection.ASC ? sql`ASC` : sql`DESC`;

    /*
     * DATA
     */
    const dataQuery = sql`
        SELECT
        id,
        organization_id AS "organizationId",
        created_by AS "createdBy",
        name,
        slug,
        type,
        environment,
        status,
        logo_url AS "logoUrl",
        homepage_url AS "homepageUrl",
        description,
        metadata,
        rate_limit AS "rateLimit",
        version,
        created_at AS "createdAt",
        updated_at AS "updatedAt",
        deleted_at AS "deletedAt"
        FROM applications
        WHERE ${whereSql}
        ORDER BY ${sortColumn} ${orderDirection}
        LIMIT ${size}
        OFFSET ${offset}
    `;

    const dataResult = await this.database.connection.execute(dataQuery);

    const countQuery = sql`
        SELECT COUNT(*)::int AS total_elements
        FROM applications
        WHERE ${whereSql}
        `;

    const countResult = await this.database.connection.execute(countQuery);

    const totalElements = Number(countResult[0]?.total_elements ?? 0);

    return new Page(
      dataResult.map(ApplicationMapper.toDomain) as ApplicationEntity[],
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
