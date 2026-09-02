import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Result } from 'src/common/result/result';
import { IApiKeyRepository } from '../../repository/iapi-key.repository';

@Injectable()
export class ExistsApiKeyByNameUseCase {
  constructor(private readonly repository: IApiKeyRepository) {}

  async execute(name: string): Promise<Result<boolean>> {
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return Result.badRequest('Name should be a non-empty string');
    }

    try {
      const exists = await this.repository.existsByName(name.trim());
      return Result.ok(exists);
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException('Error checking if api key exists by name.');
    }
  }
}
