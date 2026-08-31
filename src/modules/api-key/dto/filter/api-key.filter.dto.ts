import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { BaseFilter } from 'src/common/base/filter/filter.base';
import { ApiKeyEnvironmentEnum } from 'src/common/enums/apiKeys/api-keys.enums';

export class ApiKeyFilter extends BaseFilter {
  @IsOptional()
  @IsUUID('4', { message: 'Application ID must be a valid UUID' })
  applicationId?: string;

  @IsOptional()
  @IsUUID('4', { message: 'Created by must be a valid UUID' })
  createdBy?: string;

  @IsOptional()
  @IsString({ message: 'Name must be a string' })
  name?: string;

  @IsOptional()
  @IsEnum(ApiKeyEnvironmentEnum, {
    message: 'Environment must be a valid environment (live, test, dev)',
  })
  environment?: ApiKeyEnvironmentEnum[];

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean({ message: 'Enabled must be a boolean' })
  enabled?: boolean;
}
