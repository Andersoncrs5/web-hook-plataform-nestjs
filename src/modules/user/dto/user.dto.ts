import { BaseDto } from "src/common/base/dto/base-dto.base";
import { UserStatus } from "src/common/enums/user/user-status.enum";

export class UserDto extends BaseDto {
    name: string;
    fullName: string | null;
    email: string;
    passwordHash: string;
    emailVerified: boolean;
    status: UserStatus;
    lastLoginAt: Date | null;
}