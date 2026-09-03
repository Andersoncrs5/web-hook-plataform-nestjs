import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import { IApiKeyRepository } from '../../repository/iapi-key.repository';
import { Result } from 'src/common/result/result';
import { ApiKeyEntity } from '../../entities/api-key.entity';
import { ApiKeyEnvironmentEnum } from 'src/common/enums/apiKeys/api-keys.enums';

@Injectable()
export class ValidateApiKeyUseCase {
  constructor(private readonly repository: IApiKeyRepository) {}

  async execute(rawApiKey: string): Promise<Result<ApiKeyEntity>> {
    if (!rawApiKey || typeof rawApiKey !== 'string') {
      return Result.badRequest('API Key is required');
    }

    const keyHash = createHash('sha256').update(rawApiKey).digest('hex');

    const apiKey = await this.repository.findByKeyHash(keyHash);

    if (!apiKey) {
      return Result.notFound('Api Key not found');
    }

    if (apiKey.environment !== ApiKeyEnvironmentEnum.LIVE) {
      return Result.badRequest('Api Key is not LIVE');
    }

    if (!apiKey.enabled) {
      return Result.badRequest('Api Key is disabled');
    }

    if (apiKey.expiresAt && apiKey.expiresAt <= new Date()) {
      return Result.gone('Api Key expired!');
    }

    return Result.ok(apiKey);
  }
}
