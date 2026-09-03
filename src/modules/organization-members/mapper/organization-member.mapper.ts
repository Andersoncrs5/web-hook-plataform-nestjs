import { organizationMembers } from 'src/infra/database/schema/organization.members.schema';
import { OrganizationMemberEntity } from '../entities/organization-member.entity';
import { CreateOrganizationMemberDto } from '../dto/request/create-organization-member.dto';
import { UpdateOrganizationMemberDto } from '../dto/request/update-organization-member.dto';
import { OrganizationMemberDto } from '../dto/response/organization-member.dto';
import { OrganizationMemberStatusEnum } from 'src/common/enums/organizationMember/org.member';

type SchemaOrganizationMember = typeof organizationMembers.$inferSelect;

export class OrganizationMemberMapper {
  static merge(entity: OrganizationMemberEntity, dto: UpdateOrganizationMemberDto): void {
    const updatableFields = Object.fromEntries(
      Object.entries(dto).filter(([_, value]) => value !== undefined),
    );

    Object.assign(entity, updatableFields);
  }

  static toDomain(raw: SchemaOrganizationMember): OrganizationMemberEntity {
    return {
      ...raw,
    } as OrganizationMemberEntity;
  }

  static toOrganizationMember(dto: CreateOrganizationMemberDto): OrganizationMemberEntity {
    const member = {
      ...dto,
    } as unknown as OrganizationMemberEntity;

    return member;
  }

  static toDto(entity: OrganizationMemberEntity): OrganizationMemberDto {
    const dto: OrganizationMemberDto = {
      ...entity,
    };

    return dto;
  }

  static toPersistence(entity: OrganizationMemberEntity) {
    return {
      id: entity.id,
      organizationId: entity.organizationId,
      userId: entity.userId,
      roleId: entity.roleId,
      status: entity.status,
      version: entity.version,
    };
  }
}
