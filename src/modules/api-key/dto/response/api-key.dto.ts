import { BaseDto } from 'src/common/base/dto/base-dto.base';
import { ApiKeyEnvironmentEnum } from 'src/common/enums/apiKeys/api-keys.enums';

export class ApiKeyDto extends BaseDto {
  applicationId: string;
  createdBy?: string | null;
  name: string;
  keyPrefix?: string | null;
  keyLastChars?: string | null;
  metadata?: Record<string, any> | null;

  environment: ApiKeyEnvironmentEnum;

  lastUsedAt: Date | null;

  expiresAt: Date | null;

  enabled: boolean;
}
