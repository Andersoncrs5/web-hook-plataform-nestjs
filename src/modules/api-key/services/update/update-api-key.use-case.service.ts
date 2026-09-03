import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { isUUID } from 'class-validator';
import { Result } from 'src/common/result/result';
import { ApiKeyEntity } from '../../entities/api-key.entity';
import { UpdateApiKeyDto } from '../../dto/request/update-api-key.dto';
import { IApiKeyRepository } from '../../repository/iapi-key.repository';
import { ApiKeyMapper } from '../../mapper/api-key.mapper';

@Injectable()
export class UpdateApiKeyUseCase {
  constructor(private readonly repository: IApiKeyRepository) {}

  async execute(id: string, dto: UpdateApiKeyDto, userId: string): Promise<Result<ApiKeyEntity>> {
    if (!isUUID(userId)) return Result.badRequest('User Id should be a valid UUID');
    if (!isUUID(id)) return Result.badRequest('Id should be a valid UUID');

    const key = await this.repository.findById(id);

    if (!key) return Result.notFound('Api key not found');

    if (key.createdBy !== userId) return Result.forb('Api key is not yours');

    ApiKeyMapper.merge(key, dto);

    try {
      const updatedKey = await this.repository.update(key);

      if (!updatedKey) return Result.notFound('Api key not found');

      return Result.ok(updatedKey);
    } catch (error: any) {
      const pgError = error?.cause || error;
      const code: string = pgError?.code || '';
      const detail: string = pgError?.detail || '';
      const constraint: string = pgError?.constraint_name || pgError?.constraint || '';

      switch (code) {
        case '23505': {
          if (
            constraint.includes('uk_api_keys_application_name') ||
            detail.includes('(application_id, name)=') ||
            detail.includes('(name)=')
          ) {
            return Result.conflict(`Name '${dto.name}' already exists.`);
          }
          break;
        }

        case '22001': {
          return Result.badRequest('One or more fields exceed the maximum allowed length.');
        }

        case '22P02': {
          return Result.badRequest('Invalid input format or enum value.');
        }

        default:
          throw new InternalServerErrorException('Error updating api key.');
      }

      throw new InternalServerErrorException('Error updating api key.');
    }
  }
}
