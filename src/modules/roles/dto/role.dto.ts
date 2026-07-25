import { BaseDto } from "src/common/base/dto/base-dto.base";

export class RoleDto extends BaseDto {
    name: string;
    description: string | null;
    isActive: boolean;
}