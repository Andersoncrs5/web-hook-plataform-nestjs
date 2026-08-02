import { BaseDto } from "src/common/base/dto/base-dto.base";
import { RoleDto } from "src/modules/roles/dto/role.dto";
import { UserDto } from "src/modules/user/dto/user.dto";

export class UserRoleDTO extends BaseDto {
    userId: string
    user?: UserDto

    roleId: string
    role?: RoleDto
}