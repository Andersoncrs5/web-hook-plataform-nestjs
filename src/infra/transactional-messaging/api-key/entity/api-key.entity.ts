import { BaseEntity } from "src/common/base/entity/base.entity.base";

export class ApiKeyEntity extends BaseEntity {
    applicationId: string;
    name: string;
    keyHash: string;
    lastUsedAt: Date | null;
    expiresAt: Date | null;
    enabled: boolean;
}