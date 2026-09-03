import { BaseFilter } from 'src/common/base/filter/filter.base';
import { OrganizationMemberStatusEnum } from 'src/common/enums/organizationMember/org.member';

export class OrganizationMemberFilter extends BaseFilter {
  organizationId?: string;
  userId?: string;
  roleId?: string;
  status?: OrganizationMemberStatusEnum[];
}
