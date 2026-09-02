import {
    IsEnum,
    IsInt,
    IsNotEmpty,
    IsObject,
    IsOptional,
    IsString,
    IsUrl,
    IsUUID,
    Matches,
    MaxLength,
    Min,
} from 'class-validator';
import { ApplicationEnvironmentEnum, ApplicationStatusEnum, ApplicationTypeEnum } from 'src/common/enums/application/application.enums';

export class CreateApplicationDto {
    @IsUUID('4', { message: 'Organization ID must be a valid UUID' })
    @IsNotEmpty({ message: 'Organization ID is required' })
    organizationId: string;

    @IsString({ message: 'Name must be a string' })
    @IsNotEmpty({ message: 'Name is required' })
    @MaxLength(100, { message: 'Name cannot exceed 100 characters' })
    name: string;

    @IsString({ message: 'Slug must be a string' })
    @IsNotEmpty({ message: 'Slug is required' })
    @MaxLength(100, { message: 'Slug cannot exceed 100 characters' })
    @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
        message: 'Slug must contain only lowercase letters, numbers, and hyphens (e.g., my-application)',
    })
    slug: string;

    @IsOptional()
    @IsEnum(ApplicationTypeEnum, {
        message: 'Type must be a valid type (web, mobile, spa, m2m)',
    })
    type?: ApplicationTypeEnum;

    @IsOptional()
    @IsEnum(ApplicationEnvironmentEnum, {
        message: 'Environment must be a valid environment (dev, staging, prod)',
    })
    environment?: ApplicationEnvironmentEnum;

    @IsEnum(ApplicationStatusEnum, {
        message: 'Status must be a valid status (active, inactive, pending, archived)',
    })
    @IsNotEmpty({ message: 'Status is required' })
    status: ApplicationStatusEnum;

    @IsOptional()
    @IsUrl({}, { message: 'Logo URL must be a valid URL' })
    @MaxLength(600, { message: 'Logo URL cannot exceed 600 characters' })
    logoUrl?: string | null;

    @IsOptional()
    @IsUrl({}, { message: 'Homepage URL must be a valid URL' })
    @MaxLength(600, { message: 'Homepage URL cannot exceed 600 characters' })
    homepageUrl?: string | null;

    @IsOptional()
    @IsString({ message: 'Description must be a string' })
    @MaxLength(500, { message: 'Description cannot exceed 500 characters' })
    description?: string | null;

    @IsOptional()
    @IsObject({ message: 'Metadata must be a valid object' })
    metadata?: Record<string, any> | null;

    @IsOptional()
    @IsInt({ message: 'Rate limit must be an integer' })
    @Min(0, { message: 'Rate limit cannot be negative' })
    rateLimit?: number | null;
}