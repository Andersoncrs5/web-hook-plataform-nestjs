import { BaseFilter } from "src/common/base/filter/filter.base";
import { UserStatus } from "src/common/enums/user/user-status.enum"

export class UserFilter extends BaseFilter  {

    name?: string;

    fullName?: string;

    email?: string;

    status?: UserStatus;

}