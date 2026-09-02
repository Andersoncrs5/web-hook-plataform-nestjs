import { BaseDto } from "src/common/base/dto/base-dto.base";
import { ApplicationEnvironmentEnum, ApplicationStatusEnum, ApplicationTypeEnum } from "src/common/enums/application/application.enums";

export class ApplicationDto extends BaseDto {
    organizationId: string;
    createdBy?: string | null;
    name: string;
    slug: string;
    type: ApplicationTypeEnum;
    environment: ApplicationEnvironmentEnum;
    status: ApplicationStatusEnum;
    logoUrl?: string | null;
    homepageUrl?: string | null;
    description?: string | null;
    metadata?: Record<string, any> | null;
    rateLimit?: number | null;
}