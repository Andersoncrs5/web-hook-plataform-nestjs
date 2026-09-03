import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { isUUID } from 'class-validator';
import { Result } from 'src/common/result/result';
import { ApiKeyEntity } from '../../entities/api-key.entity';
import { IApiKeyRepository } from '../../repository/iapi-key.repository';

@Injectable()
export class FindAllApiKeysByApplicationIdUseCase {
  constructor(private readonly repository: IApiKeyRepository) {}

  async execute(applicationId: string, limit?: number): Promise<Result<ApiKeyEntity[]>> {
    if (!isUUID(applicationId)) return Result.badRequest('Application Id should be a valid UUID');

    try {
      const keys = await this.repository.findAllByApplicationId(applicationId, limit);
      return Result.ok(keys);
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException('Error retrieving api keys by application id.');
    }
  }
}
