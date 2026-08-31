import { BaseFilter } from "src/common/base/filter/filter.base";
import { OrganizationStatus } from "src/common/enums/organization/organization-status.enum";

export class OrganizationFilter extends BaseFilter {
    name?: string;   
    slug?: string;
    status?: OrganizationStatus[];
    userId?: string;
    metadata?: Record<string, any> | null;
}