import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { isUUID } from 'class-validator';
import { Result } from 'src/common/result/result';
import { IApiKeyRepository } from '../../repository/iapi-key.repository';

@Injectable()
export class ExistsApiKeyByApplicationIdAndNameUseCase {
  constructor(private readonly repository: IApiKeyRepository) {}

  async execute(applicationId: string, name: string): Promise<Result<boolean>> {
    if (!isUUID(applicationId)) {
      return Result.badRequest('Application Id should be a valid UUID');
    }

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return Result.badRequest('Name should be a non-empty string');
    }

    try {
      const exists = await this.repository.existsByApplicationIdAndName(applicationId, name.trim());
      return Result.ok(exists);
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(
        'Error checking if api key exists by application id and name.',
      );
    }
  }
}
