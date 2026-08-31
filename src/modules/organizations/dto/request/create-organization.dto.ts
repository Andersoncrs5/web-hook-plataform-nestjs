import { 
  IsString, 
  IsNotEmpty, 
  MaxLength, 
  IsEnum, 
  IsOptional, 
  IsObject,
  Matches
} from "class-validator";
import { OrganizationStatus } from "src/common/enums/organization/organization-status.enum";

export class CreateOrganizationDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(150)
    name: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
        message: 'slug deve conter apenas letras minúsculas, números e hífens'
    })
    slug: string;

    @IsEnum(OrganizationStatus)
    @IsOptional()
    status?: OrganizationStatus = OrganizationStatus.ACTIVE;

    @IsOptional()
    @IsObject()
    metadata?: Record<string, any> | null;
}