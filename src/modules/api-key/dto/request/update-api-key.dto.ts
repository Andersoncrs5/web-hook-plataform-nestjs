import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';
import { CreateApiKeyDto } from './create-api-key.dto';

export class UpdateApiKeyDto extends PartialType(CreateApiKeyDto) {
  @IsOptional()
  @IsBoolean({ message: 'Enabled must be a boolean' })
  enabled?: boolean;
}
