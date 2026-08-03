import { BaseEntity } from "src/common/base/entity/base.entity.base";
import { userRoles } from "src/infra/database/schema/user.roles.schemas";
import { Role } from "src/modules/roles/entities/role.entity";
import { User } from "src/modules/user/entities/user.entity";

export type NewUserRole = typeof userRoles.$inferInsert

export class UserRole extends BaseEntity {
        
    userId: string;
    user?: User

    roleId: string;
    role?: Role
}