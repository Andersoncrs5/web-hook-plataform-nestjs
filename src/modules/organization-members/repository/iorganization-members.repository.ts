import { IBaseRepository } from 'src/common/base/repository/ibase.repository';
import { OrganizationMemberEntity } from '../entities/organization-member.entity';
import { OrganizationMemberFilter } from '../dto/filter/organization-member-filter.dto';
import { Page, Pageable } from 'src/common/page/page';
import { OrganizationMemberSort } from '../dto/filter/organization-member-sort.dto';

export abstract class IOrganizationMemberRepository extends IBaseRepository<OrganizationMemberEntity> {
  abstract findAll(
    filter: OrganizationMemberFilter,
    pageble: Pageable<OrganizationMemberSort>,
  ): Promise<Page<OrganizationMemberEntity>>;

  abstract existsByOrganizationIdAndUserId(
    organizationId: string,
    userId: string,
  ): Promise<boolean>;

  abstract existsByOrganizationIdAndRoleId(
    organizationId: string,
    roleId: string,
  ): Promise<boolean>;
}
