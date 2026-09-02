import { Injectable } from '@nestjs/common';
import { isUUID } from 'class-validator';
import { Result } from 'src/common/result/result';
import { IsOwnerUseCase } from 'src/modules/application/services/is-owner/is-owner.use-case.service';
import { IApiKeyRepository } from '../../repository/iapi-key.repository';

@Injectable()
export class CountApiKeysByApplicationIdUseCase {
  constructor(
    private readonly repository: IApiKeyRepository,
    private readonly isOwnerApplication: IsOwnerUseCase,
  ) {}

  async execute(applicationId: string, userId: string): Promise<Result<number>> {
    if (!isUUID(applicationId)) {
      return Result.badRequest('Application ID should be a valid UUID');
    }

    if (!isUUID(userId)) {
      return Result.badRequest('User ID should be a valid UUID');
    }

    const isOwnerResult = await this.isOwnerApplication.execute(applicationId, userId);

    if (isOwnerResult.isFailure) {
      return Result.failure(isOwnerResult.errors, isOwnerResult.status);
    }

    if (!isOwnerResult.value) {
      return Result.forb('User does not have access to this application');
    }

    const count = await this.repository.countByApplicationId(applicationId);

    return Result.ok(count);
  }
}
