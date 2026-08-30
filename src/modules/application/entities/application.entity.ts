import { BaseEntity } from "src/common/base/entity/base.entity.base";
import {
    ApplicationEnvironmentEnum,
    ApplicationStatusEnum,
    ApplicationTypeEnum,
} from "../../../common/enums/application/application.enums";

export class ApplicationEntity extends BaseEntity {
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