import { IBaseRepository } from 'src/common/base/repository/ibase.repository';
import { ApiKeyEntity } from '../entities/api-key.entity';
import { ApiKeyFilterDto } from '../dto/filter/api-key.filter.dto';
import { Page, Pageable } from 'src/common/page/page';
import { ApiKeySort } from '../dto/filter/api-key-sort.dto';

export abstract class IApiKeyRepository extends IBaseRepository<ApiKeyEntity> {
  abstract countByApplicationId(applicationId: string): Promise<number>;
  abstract findByKeyHash(keyHash: string): Promise<ApiKeyEntity | null>;

  abstract findAllByApplicationId(
    applicationId: string,
    limit?: number,
  ): Promise<Array<ApiKeyEntity>>;

  abstract findAll(
    filter: ApiKeyFilterDto,
    pageble: Pageable<ApiKeySort>,
  ): Promise<Page<ApiKeyEntity>>;

  abstract existsByName(name: string): Promise<boolean>;

  abstract existsByApplicationIdAndName(applicationId: string, name: string): Promise<boolean>;
}
