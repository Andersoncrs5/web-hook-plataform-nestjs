import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { isUUID } from 'class-validator';
import { createHash, randomBytes } from 'crypto';
import { Result } from 'src/common/result/result';
import { IsOwnerUseCase } from 'src/modules/application/services/is-owner/is-owner.use-case.service';
import { ApiKeyEntity } from '../../entities/api-key.entity';
import { IApiKeyRepository } from '../../repository/iapi-key.repository';

export interface RotateApiKeyResponse {
  apiKey: ApiKeyEntity;
  rawKey: string;
}

@Injectable()
export class RotateApiKeyUseCase {
  constructor(
    private readonly repository: IApiKeyRepository,
    private readonly isOwnerApplication: IsOwnerUseCase,
  ) {}

  async execute(apiKeyId: string, userId: string): Promise<Result<RotateApiKeyResponse>> {
    if (!isUUID(apiKeyId)) return Result.badRequest('API Key Id should be a valid UUID');
    if (!isUUID(userId)) return Result.badRequest('User Id should be a valid UUID');

    const apiKey = await this.repository.findById(apiKeyId);
    if (!apiKey) return Result.notFound('API key not found');

    const isOwnerResult = await this.isOwnerApplication.execute(apiKey.applicationId, userId);
    if (isOwnerResult.isFailure) return Result.failure(isOwnerResult.errors, isOwnerResult.status);

    if (!isOwnerResult.value) {
      return Result.forb('User does not have access to this application');
    }

    const randomSecret = randomBytes(36).toString('hex');
    const rawKey = `pk_${apiKey.environment}_${randomSecret}`;

    const keyHash = createHash('sha256').update(rawKey).digest('hex');
    const keyPrefix = rawKey.slice(0, 12);
    const keyLastChars = rawKey.slice(-4);

    apiKey.keyHash = keyHash;
    apiKey.keyPrefix = keyPrefix;
    apiKey.keyLastChars = keyLastChars;
    apiKey.updatedAt = new Date();

    try {
      const updatedApiKey: ApiKeyEntity = await this.repository.update(apiKey);

      return Result.ok({
        apiKey: updatedApiKey,
        rawKey,
      });
    } catch (error) {
      const pgError = error?.cause || error;

      const code: string = pgError?.code || '';
      const detail: string = pgError?.detail || '';
      const constraint: string = pgError?.constraint_name || pgError?.constraint || '';

      switch (code) {
        case '23505': {
          if (constraint.includes('uk_api_keys_key_hash') || detail.includes('(key_hash)=')) {
            return Result.conflict('Key Hash already exists.');
          }
          break;
        }

        case '23503': {
          return Result.notFound('Related record not found.');
        }

        case '22001': {
          return Result.badRequest('One or more fields exceed the maximum allowed length.');
        }

        default:
          throw new InternalServerErrorException('Error rotating API key.');
      }

      throw new InternalServerErrorException('Error rotating API key.');
    }
  }
}
