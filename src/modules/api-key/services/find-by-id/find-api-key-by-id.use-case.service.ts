import { Injectable } from '@nestjs/common';
import { isUUID } from 'class-validator';
import { Result } from 'src/common/result/result';
import { ApiKeyEntity } from '../../entities/api-key.entity';
import { IApiKeyRepository } from '../../repository/iapi-key.repository';

@Injectable()
export class FindApiKeyByIdUseCase {
  constructor(private readonly repository: IApiKeyRepository) {}

  async execute(id: string, userId: string): Promise<Result<ApiKeyEntity>> {
    if (!isUUID(userId)) {
      return Result.badRequest('User Id should be a valid UUID');
    }

    if (!isUUID(id)) {
      return Result.badRequest('Id should be a valid UUID');
    }

    const key = await this.repository.findById(id);

    if (!key) {
      return Result.notFound('Api key not found');
    }

    if (key.createdBy !== userId) {
      return Result.forb('Api key is not yours');
    }

    return Result.ok(key);
  }
}
