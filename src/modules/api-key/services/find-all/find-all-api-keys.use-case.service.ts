import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { IApiKeyRepository } from '../../repository/iapi-key.repository';
import { Page, Pageable } from 'src/common/page/page';
import { ApiKeyEntity } from '../../entities/api-key.entity';
import { Result } from 'src/common/result/result';
import { ApiKeySort } from '../../dto/filter/api-key-sort.dto';
import { ApiKeyFilterDto } from '../../dto/filter/api-key.filter.dto';

@Injectable()
export class FindAllApiKeysUseCase {
  constructor(private readonly repository: IApiKeyRepository) {}

  async execute(
    filter: ApiKeyFilterDto,
    pageable: Pageable<ApiKeySort>,
  ): Promise<Result<Page<ApiKeyEntity>>> {
    try {
      const page = await this.repository.findAll(filter, pageable);
      return Result.ok(page);
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException('Error retrieving api keys page.');
    }
  }
}
