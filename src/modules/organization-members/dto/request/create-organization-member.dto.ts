import { OrganizationMemberStatusEnum } from 'src/common/enums/organizationMember/org.member';

export class CreateOrganizationMemberDto {
  organizationId: string;
  userId: string;
  roleId: string;
  status: OrganizationMemberStatusEnum;
}
