import { IBaseRepository } from 'src/common/base/repository/ibase.repository';
import { ApiKeyEntity } from '../entities/api-key.entity';
import { ApiKeyFilter } from '../dto/filter/api-key.filter.dto';
import { Page, Pageable } from 'src/common/page/page';
import { ApiKeySort } from '../dto/filter/api-key-sort.dto';

export abstract class IApiKeyRepository extends IBaseRepository<ApiKeyEntity> {
  abstract findAllByApplicationId(
    applicationId: string,
    limit?: number,
  ): Promise<Array<ApiKeyEntity>>;

  abstract findAll(
    filter: ApiKeyFilter,
    pageble: Pageable<ApiKeySort>,
  ): Promise<Page<ApiKeyEntity>>;

  abstract existsByName(name: string): Promise<boolean>;
}
