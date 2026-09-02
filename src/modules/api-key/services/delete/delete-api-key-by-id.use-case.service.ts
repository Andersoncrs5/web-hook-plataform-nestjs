import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { IApiKeyRepository } from '../../repository/iapi-key.repository';
import { ApiKeyEntity } from '../../entities/api-key.entity';
import { Result } from 'src/common/result/result';
import { isUUID } from 'class-validator';

@Injectable()
export class DeleteApiKeyByIdUseCase {
  constructor(private readonly repository: IApiKeyRepository) {}

  async execute(id: string, userId: string): Promise<Result<null>> {
    if (!isUUID(userId)) return Result.badRequest('User Id should be a valid UUID');
    if (!isUUID(id)) return Result.badRequest('Id should be a valid UUID');

    const key: ApiKeyEntity | null = await this.repository.findById(id);

    if (key == null) return Result.notFound('Api key not found');

    if (key.createdBy !== userId) return Result.forb('Api key is not yours');

    try {
      const deletedCount: number = await this.repository.deleteByIdAndCount(key.id);

      if (deletedCount === 0) {
        return Result.notFound('Api key not found');
      }

      return Result.ok();
    } catch (error: any) {
      const pgError = error?.cause || error;
      const code: string = pgError?.code || '';

      if (code === '23503') {
        return Result.badRequest(
          'Cannot delete api key because it is referenced by other resources.',
        );
      }

      throw new InternalServerErrorException('Error deleting api key.');
    }
  }
}
