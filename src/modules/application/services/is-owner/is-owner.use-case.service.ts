import { Injectable } from '@nestjs/common';
import { isUUID } from 'class-validator';
import { IApplicationRepository } from '../../repository/iapplication.repository';
import { Result } from 'src/common/result/result';

@Injectable()
export class IsOwnerUseCase {
  constructor(private readonly repository: IApplicationRepository) {}

  async execute(applicationId: string, userId: string): Promise<Result<boolean>> {
    if (!isUUID(applicationId)) {
      return Result.badRequest('Id should be a valid UUID');
    }

    if (!isUUID(userId)) {
      return Result.badRequest('Id should be a valid UUID');
    }

    const isOwner = await this.repository.isOwner(applicationId, userId);
    return Result.ok(isOwner);
  }
}
