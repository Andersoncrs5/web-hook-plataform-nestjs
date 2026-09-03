import { PartialType } from '@nestjs/swagger';
import { CreateOrganizationMemberDto } from './create-organization-member.dto';

export class UpdateOrganizationMemberDto extends PartialType(CreateOrganizationMemberDto) {}
