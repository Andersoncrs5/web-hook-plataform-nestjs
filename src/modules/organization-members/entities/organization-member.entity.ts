import { BaseEntity } from 'src/common/base/entity/base.entity.base';
import { OrganizationMemberStatusEnum } from 'src/common/enums/organizationMember/org.member';

export class OrganizationMemberEntity extends BaseEntity {
  organizationId: string;
  userId: string;
  roleId: string;
  status: OrganizationMemberStatusEnum;
}
