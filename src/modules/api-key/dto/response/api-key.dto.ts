import { BaseDto } from 'src/common/base/dto/base-dto.base';
import { ApiKeyEnvironmentEnum } from 'src/common/enums/apiKeys/api-keys.enums';

export class ApiKeyDto extends BaseDto {
  applicationId: string;
  createdBy?: string | null;
  name: string;
  keyPrefix?: string | null;
  keyLastChars?: string | null;
  scopes: string[];
  environment: ApiKeyEnvironmentEnum;
  allowedIps?: string[] | null;
  rateLimitOverride?: number | null;
  lastUsedAt?: Date | null;
  lastUsedIp?: string | null;
  enabled: boolean;
  expiresAt?: Date | null;
  revokedAt?: Date | null;
  revokedReason?: string | null;
}
