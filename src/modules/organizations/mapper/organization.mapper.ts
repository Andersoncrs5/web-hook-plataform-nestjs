import { organizations } from "src/infra/database/schema/organization.schema";
import { OrganizationStatus } from "src/common/enums/organization/organization-status.enum";
import { OrganizationEntity } from "../entities/organization.entity";
import { OrganizationDTO } from "../dto/response/organization.dto";
import { CreateOrganizationDto } from "../dto/request/create-organization.dto";
import { UpdateOrganizationDto } from "../dto/request/update-organization.dto";

type SchemaOrganization = typeof organizations.$inferSelect;

export class OrganizationMapper {

    static merge(org: OrganizationEntity, dto: UpdateOrganizationDto): void {
        const updatableFields = Object.fromEntries(
            Object.entries(dto).filter(([_, value]) => value !== undefined)
        );

        Object.assign(org, updatableFields);
    }

    static toDomain(raw: SchemaOrganization): OrganizationEntity {
        const organization = new OrganizationEntity();

        Object.assign(organization, raw);

        return organization;
    }

    static toPersistence(organization: OrganizationEntity) {
        return {
            id: organization.id,
            name: organization.name,
            slug: organization.slug,
            status: organization.status,
            userId: organization.userId,
            metadata: organization.metadata ?? null,
            version: organization.version,
            createdAt: organization.createdAt,
            updatedAt: organization.updatedAt,
            deletedAt: organization.deletedAt ?? null,
        };
    }

    static toDto(organization: OrganizationEntity): OrganizationDTO {
        const dto = new OrganizationDTO();

        dto.id = organization.id;
        dto.name = organization.name;
        dto.slug = organization.slug;
        dto.status = organization.status;
        dto.userId = organization.userId;
        dto.metadata = organization.metadata;
        dto.version = organization.version;
        dto.createdAt = organization.createdAt;
        dto.updatedAt = organization.updatedAt;

        return dto;
    }

    static create(dto: CreateOrganizationDto, userId: string): OrganizationEntity {
        const organization = new OrganizationEntity();

        organization.name = dto.name;
        organization.slug = dto.slug;
        organization.status = dto.status ?? OrganizationStatus.ACTIVE;
        organization.userId = userId;
        organization.metadata = dto.metadata ?? null;
        organization.version = 0;

        return organization;
    }
}