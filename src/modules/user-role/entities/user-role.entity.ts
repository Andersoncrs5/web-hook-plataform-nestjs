import { IsUUID } from "class-validator";
import { BaseEntity } from "src/common/base/entity/base.entity.base";
import { userRoles } from "src/infra/database/schema/user.roles.schema";
import { Role } from "src/modules/roles/entities/role.entity";
import { User } from "src/modules/user/entities/user.entity";

export type NewUserRole = typeof userRoles.$inferInsert

export class UserRole extends BaseEntity {
        
    @IsUUID('all', { message: 'User ID must be a valid UUID' })
    userId: string;
    user?: User

    @IsUUID('all', { message: 'Role ID must be a valid UUID' })
    roleId: string;
    role?: Role
}