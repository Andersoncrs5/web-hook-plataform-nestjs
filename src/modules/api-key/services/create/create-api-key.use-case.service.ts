import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { isUUID } from 'class-validator';
import { createHash, randomBytes } from 'crypto';
import { Result } from 'src/common/result/result';
import { ApiKeyEnvironmentEnum } from 'src/common/enums/apiKeys/api-keys.enums';
import { IsOwnerUseCase } from 'src/modules/application/services/is-owner/is-owner.use-case.service';
import { ApiKeyEntity } from '../../entities/api-key.entity';
import { CreateApiKeyDto } from '../../dto/request/create-api-key.dto';
import { ApiKeyMapper } from '../../mapper/api-key.mapper';
import { IApiKeyRepository } from '../../repository/iapi-key.repository';

export interface CreateApiKeyResponse {
  apiKey: ApiKeyEntity;
  rawKey: string;
}

@Injectable()
export class CreateApiKeyUseCase {
  constructor(
    private readonly repository: IApiKeyRepository,
    private readonly isOwnerApplication: IsOwnerUseCase,
  ) {}

  async execute(dto: CreateApiKeyDto, userId: string): Promise<Result<CreateApiKeyResponse>> {
    if (!isUUID(userId)) {
      return Result.badRequest('User Id should be a valid UUID');
    }

    const isOwnerResult = await this.isOwnerApplication.execute(dto.applicationId, userId);

    if (isOwnerResult.isFailure) {
      return Result.failure(isOwnerResult.errors, isOwnerResult.status);
    }

    if (!isOwnerResult.value) {
      return Result.forb('User does not have access to this application');
    }

    const environment = dto.environment ?? ApiKeyEnvironmentEnum.LIVE;
    const randomSecret = randomBytes(36).toString('hex');
    const rawKey = `pk_${environment}_${randomSecret}`;

    const keyHash = createHash('sha256').update(rawKey).digest('hex');
    const keyPrefix = rawKey.slice(0, 12);
    const keyLastChars = rawKey.slice(-4);

    const key: ApiKeyEntity = ApiKeyMapper.toApiKey(dto);

    key.createdBy = userId;
    key.keyHash = keyHash;
    key.keyPrefix = keyPrefix;
    key.keyLastChars = keyLastChars;
    key.environment = environment;
    key.enabled = dto.enabled ?? true;
    key.expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : null;

    try {
      const createdApiKey = await this.repository.create(key);

      return Result.created({
        apiKey: createdApiKey,
        rawKey,
      });
    } catch (error) {
      const pgError = error?.cause || error;

      const code: string = pgError?.code || '';
      const detail: string = pgError?.detail || '';
      const constraint: string = pgError?.constraint_name || pgError?.constraint || '';

      switch (code) {
        case '23505': {
          if (
            constraint.includes('uk_api_keys_application_name') ||
            detail.includes('(application_id, name)=') ||
            detail.includes('(name)=')
          ) {
            return Result.conflict(`Name '${dto.name}' already exists.`);
          }

          if (constraint.includes('uk_api_keys_key_hash') || detail.includes('(key_hash)=')) {
            return Result.conflict('Key Hash already exists.');
          }
          break;
        }

        case '23503': {
          if (constraint.includes('fk_api_keys_created_by') || detail.includes('created_by')) {
            return Result.notFound('The specified User does not exist.');
          }

          if (constraint.includes('fk_api_keys_application') || detail.includes('application_id')) {
            return Result.notFound('The specified Application does not exist.');
          }
          break;
        }

        case '23502': {
          const missingField = pgError?.column || 'unknown field';
          return Result.badRequest(`The field "${missingField}" cannot be null.`);
        }

        case '22001': {
          return Result.badRequest('One or more fields exceed the maximum allowed length.');
        }

        case '22P02': {
          return Result.badRequest('Invalid input format or enum value.');
        }

        default:
          throw new InternalServerErrorException('Error creating API key.');
      }

      throw new InternalServerErrorException('Error creating API key.');
    }
  }
}
