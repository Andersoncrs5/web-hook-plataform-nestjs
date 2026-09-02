import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { BaseFilter } from 'src/common/base/filter/filter.base';
import {
  ApplicationEnvironmentEnum,
  ApplicationStatusEnum,
  ApplicationTypeEnum,
} from 'src/common/enums/application/application.enums';

export class ApplicationFilterDto extends BaseFilter {
  @IsOptional()
  @IsUUID('4')
  organizationId?: string | undefined | null;

  @IsOptional()
  @IsUUID('4')
  createdBy?: string | undefined | null;

  @IsOptional()
  @IsString()
  name?: string | undefined | null;

  @IsOptional()
  @IsString()
  slug?: string | undefined | null;

  @IsOptional()
  @IsArray()
  @IsEnum(ApplicationTypeEnum, { each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : value?.split(',')))
  type?: ApplicationTypeEnum[] | undefined | null;

  @IsOptional()
  @IsArray()
  @IsEnum(ApplicationEnvironmentEnum, { each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : value?.split(',')))
  environment?: ApplicationEnvironmentEnum[] | undefined | null;

  @IsOptional()
  @IsArray()
  @IsEnum(ApplicationStatusEnum, { each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : value?.split(',')))
  status?: ApplicationStatusEnum[] | undefined | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  rateLimitMin?: number | undefined | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  rateLimitMax?: number | undefined | null;
}
