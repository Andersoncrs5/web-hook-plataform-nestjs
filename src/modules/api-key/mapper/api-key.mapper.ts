import { apiKeys } from 'src/infra/database/schema/api.keys.schema';
import { ApiKeyEntity } from '../entities/api-key.entity';
import { UpdateApiKeyDto } from '../dto/request/update-api-key.dto';
import { ApiKeyEnvironmentEnum } from 'src/common/enums/apiKeys/api-keys.enums';
import { CreateApiKeyDto } from '../dto/request/create-api-key.dto';
import { ApiKeyDto } from '../dto/response/api-key.dto';

type SchemaApiKey = typeof apiKeys.$inferSelect;

export class ApiKeyMapper {
  static merge(entity: ApiKeyEntity, dto: UpdateApiKeyDto): void {
    const updatableFields = Object.fromEntries(
      Object.entries(dto).filter(([_, value]) => value !== undefined),
    );

    Object.assign(entity, updatableFields);
  }

  static toDomain(raw: SchemaApiKey): ApiKeyEntity {
    return {
      id: raw.id,
      applicationId: raw.applicationId,
      createdBy: raw.createdBy,
      name: raw.name,
      keyHash: raw.keyHash,
      keyPrefix: raw.keyPrefix,
      keyLastChars: raw.keyLastChars,
      metadata: (raw.metadata as Record<string, any>) ?? null,
      environment: raw.environment as ApiKeyEnvironmentEnum,
      lastUsedAt: raw.lastUsedAt,
      expiresAt: raw.expiresAt,
      enabled: raw.enabled,
      version: raw.version,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      deletedAt: raw.deletedAt,
    } as ApiKeyEntity;
  }

  static toApiKey(dto: CreateApiKeyDto): ApiKeyEntity {
    const apiKey = {
      ...dto,
    } as unknown as ApiKeyEntity;

    return apiKey;
  }

  static toDto(apiKey: ApiKeyEntity): ApiKeyDto {
    const dto: ApiKeyDto = {
      ...apiKey,
    };

    return dto;
  }

  static toPersistence(apiKey: ApiKeyEntity) {
    return {
      id: apiKey.id,
      applicationId: apiKey.applicationId,
      createdBy: apiKey.createdBy,
      name: apiKey.name,
      keyHash: apiKey.keyHash,
      keyPrefix: apiKey.keyPrefix,
      keyLastChars: apiKey.keyLastChars,
      metadata: apiKey.metadata,
      environment: apiKey.environment,
      lastUsedAt: apiKey.lastUsedAt,
      expiresAt: apiKey.expiresAt,
      enabled: apiKey.enabled,
      version: apiKey.version,
    };
  }
}
