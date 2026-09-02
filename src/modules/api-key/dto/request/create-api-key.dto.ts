import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { ApiKeyEnvironmentEnum } from 'src/common/enums/apiKeys/api-keys.enums';

export class CreateApiKeyDto {
  @IsUUID('4', { message: 'Application ID must be a valid UUID' })
  @IsNotEmpty({ message: 'Application ID is required' })
  applicationId: string;

  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name is required' })
  @MaxLength(100, { message: 'Name cannot exceed 100 characters' })
  name: string;

  @IsOptional()
  @IsEnum(ApiKeyEnvironmentEnum, {
    message: 'Environment must be a valid environment (live, test, dev)',
  })
  environment?: ApiKeyEnvironmentEnum;

  @IsOptional()
  @IsDateString({}, { message: 'Expires at must be a valid ISO date string' })
  expiresAt?: string;

  @IsBoolean({ message: 'Enabled must be a boolean' })
  enabled: boolean;
}
