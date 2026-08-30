import { BaseEntity } from "src/common/base/entity/base.entity.base";
import { OrganizationStatus } from "src/common/enums/organization/organization-status.enum";

export class OrganizationEntity extends BaseEntity {
    name: string;
    slug: string;
    status: OrganizationStatus;
    userId: string;
    metadata?: Record<string, any> | null;
}