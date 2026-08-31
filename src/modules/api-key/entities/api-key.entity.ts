import { BaseEntity } from 'src/common/base/entity/base.entity.base';
import { ApiKeyEnvironmentEnum } from 'src/common/enums/apiKeys/api-keys.enums';

export class ApiKeyEntity extends BaseEntity {
  applicationId: string;

  createdBy: string;

  name: string;

  keyHash: string;

  keyPrefix?: string | null;

  keyLastChars?: string | null;

  metadata?: Record<string, any> | null;

  environment: ApiKeyEnvironmentEnum;

  lastUsedAt: Date | null;

  expiresAt: Date | null;

  enabled: boolean;
}
