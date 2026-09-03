import { BaseDto } from 'src/common/base/dto/base-dto.base';
import { OrganizationMemberStatusEnum } from 'src/common/enums/organizationMember/org.member';

export class OrganizationMemberDto extends BaseDto {
  organizationId: string;
  userId: string;
  roleId: string;
  status: OrganizationMemberStatusEnum;
}
