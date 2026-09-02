import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { isUUID } from 'class-validator';
import { Result } from 'src/common/result/result';
import { IApiKeyRepository } from '../../repository/iapi-key.repository';

@Injectable()
export class ExistsApiKeyByIdUseCase {
  constructor(private readonly repository: IApiKeyRepository) {}

  async execute(id: string): Promise<Result<boolean>> {
    if (!isUUID(id)) {
      return Result.badRequest('Id should be a valid UUID');
    }

    try {
      const exists = await this.repository.existsById(id);
      return Result.ok(exists);
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException('Error checking if api key exists by id.');
    }
  }
}
