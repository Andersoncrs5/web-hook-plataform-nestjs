import { BaseFilter } from "src/common/base/filter/filter.base";

export class UserRoleFilter extends BaseFilter  {
    userId?: string
    roleId?: string

    loadUser?:boolean
    loadRole?:boolean
}