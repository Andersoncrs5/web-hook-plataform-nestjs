import { Injectable } from '@nestjs/common';
import { SQL, and, asc, desc, eq, gte, ilike, inArray, isNull, lte, sql } from 'drizzle-orm';
import { BaseRepository } from 'src/common/base/repository/base.repository';
import { ApiKeyEntity } from '../entities/api-key.entity';
import { IApiKeyRepository } from '../repository/iapi-key.repository';
import { ApiKeyMapper } from '../mapper/api-key.mapper';
import { DatabaseService } from 'src/infra/database/database.service';
import { apiKeys } from 'src/infra/database/schema/api.keys.schema';
import { eqIgnoreCase } from 'src/common/repository/custom.query';
import { Pageable, Page, SortDirection } from 'src/common/page/page';
import { ApiKeySort } from '../dto/filter/api-key-sort.dto';
import { ApiKeyFilter } from '../dto/filter/api-key.filter.dto';

@Injectable()
export class ApiKeyRepository
  extends BaseRepository<ApiKeyEntity, typeof apiKeys>
  implements IApiKeyRepository
{
  constructor(database: DatabaseService) {
    super(database, apiKeys, ApiKeyMapper.toDomain, ApiKeyMapper.toPersistence);
  }

  async findAll(filter: ApiKeyFilter, pageable: Pageable<ApiKeySort>): Promise<Page<ApiKeyEntity>> {
    const page = pageable.page ?? 1;
    const size = pageable.size ?? 30;
    const offset = (page - 1) * size;

    const sortBy = pageable.sortBy ?? ApiKeySort.CREATED_AT;
    const direction = pageable.direction ?? SortDirection.DESC;

    /*
     * FILTERS
     */
    const conditions: SQL[] = [isNull(apiKeys.deletedAt)];

    /*
     * ID
     */
    if (filter.id != null) {
      conditions.push(eq(apiKeys.id, filter.id));
    }

    /*
     * APPLICATION ID
     */
    if (filter.applicationId != null) {
      conditions.push(eq(apiKeys.applicationId, filter.applicationId));
    }

    /*
     * CREATED BY
     */
    if (filter.createdBy != null) {
      conditions.push(eq(apiKeys.createdBy, filter.createdBy));
    }

    /*
     * NAME
     */
    if (filter.name != null) {
      conditions.push(ilike(apiKeys.name, `%${filter.name}%`));
    }

    /*
     * ENVIRONMENT
     */
    if (filter.environment?.length) {
      conditions.push(inArray(apiKeys.environment, filter.environment));
    }

    /*
     * ENABLED
     */
    if (filter.enabled != null) {
      conditions.push(eq(apiKeys.enabled, filter.enabled));
    }

    /*
     * VERSION
     */
    if (filter.version != null) {
      conditions.push(eq(apiKeys.version, filter.version));
    }

    /*
     * CREATED AT
     */
    if (filter.createdAtMin != null) {
      conditions.push(gte(apiKeys.createdAt, filter.createdAtMin));
    }

    if (filter.createdAtMax != null) {
      conditions.push(lte(apiKeys.createdAt, filter.createdAtMax));
    }

    /*
     * UPDATED AT
     */
    if (filter.updatedAtMin != null) {
      conditions.push(gte(apiKeys.updatedAt, filter.updatedAtMin));
    }

    if (filter.updatedAtMax != null) {
      conditions.push(lte(apiKeys.updatedAt, filter.updatedAtMax));
    }

    const where = and(...conditions);

    /*
     * SORT
     */
    const sortableColumns = {
      [ApiKeySort.ID]: apiKeys.id,
      [ApiKeySort.APPLICATION_ID]: apiKeys.applicationId,
      [ApiKeySort.CREATED_BY]: apiKeys.createdBy,
      [ApiKeySort.NAME]: apiKeys.name,
      [ApiKeySort.KEY_PREFIX]: apiKeys.keyPrefix,
      [ApiKeySort.KEY_LAST_CHARS]: apiKeys.keyLastChars,
      [ApiKeySort.ENVIRONMENT]: apiKeys.environment,
      [ApiKeySort.LAST_USED_AT]: apiKeys.lastUsedAt,
      [ApiKeySort.EXPIRES_AT]: apiKeys.expiresAt,
      [ApiKeySort.ENABLED]: apiKeys.enabled,
      [ApiKeySort.VERSION]: apiKeys.version,
      [ApiKeySort.CREATED_AT]: apiKeys.createdAt,
      [ApiKeySort.UPDATED_AT]: apiKeys.updatedAt,
    } as const;

    const sortColumn = sortableColumns[sortBy] ?? apiKeys.createdAt;

    const orderBy = direction === SortDirection.ASC ? asc(sortColumn) : desc(sortColumn);

    /*
     * DATA
     */
    const result = await this.database.connection
      .select({
        id: apiKeys.id,
        applicationId: apiKeys.applicationId,
        createdBy: apiKeys.createdBy,
        name: apiKeys.name,
        keyHash: apiKeys.keyHash,
        keyPrefix: apiKeys.keyPrefix,
        keyLastChars: apiKeys.keyLastChars,
        metadata: apiKeys.metadata,
        environment: apiKeys.environment,
        lastUsedAt: apiKeys.lastUsedAt,
        expiresAt: apiKeys.expiresAt,
        enabled: apiKeys.enabled,
        version: apiKeys.version,
        createdAt: apiKeys.createdAt,
        updatedAt: apiKeys.updatedAt,
        deletedAt: apiKeys.deletedAt,
      })
      .from(apiKeys)
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
      .from(apiKeys)
      .where(where);

    const totalElements = countResult?.totalElements ?? 0;

    return new Page(result.map(ApiKeyMapper.toDomain), page, size, totalElements);
  }

  async findAllByApplicationId(
    applicationId: string,
    limit?: number,
  ): Promise<Array<ApiKeyEntity>> {
    const result = await this.database.connection
      .select({
        id: apiKeys.id,
        applicationId: apiKeys.applicationId,
        createdBy: apiKeys.createdBy,
        name: apiKeys.name,
        keyHash: apiKeys.keyHash,
        keyPrefix: apiKeys.keyPrefix,
        keyLastChars: apiKeys.keyLastChars,
        metadata: apiKeys.metadata,
        environment: apiKeys.environment,
        lastUsedAt: apiKeys.lastUsedAt,
        expiresAt: apiKeys.expiresAt,
        enabled: apiKeys.enabled,
        version: apiKeys.version,
        createdAt: apiKeys.createdAt,
        updatedAt: apiKeys.updatedAt,
        deletedAt: apiKeys.deletedAt,
      })
      .from(apiKeys)
      .limit(limit ?? 50)
      .where(and(eq(apiKeys.applicationId, applicationId), isNull(apiKeys.deletedAt)));

    return result.map(ApiKeyMapper.toDomain);
  }

  async existsByName(name: string): Promise<boolean> {
    const [existing] = await this.database.connection
      .select({ id: apiKeys.id })
      .from(apiKeys)
      .where(and(eqIgnoreCase(apiKeys.name, name), isNull(apiKeys.deletedAt)))
      .limit(1);

    return existing !== undefined;
  }
}
