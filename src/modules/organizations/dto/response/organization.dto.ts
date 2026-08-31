import { BaseDto } from "src/common/base/dto/base-dto.base";
import { OrganizationStatus } from "src/common/enums/organization/organization-status.enum";

export class OrganizationDTO extends BaseDto {
    name: string;
    slug: string;
    status: OrganizationStatus;
    userId: string;
    metadata?: Record<string, any> | null;
}