import { userRoles } from "src/infra/database/schema/user.roles.schema";
import { UserRole } from "../entities/user-role.entity";
import { CreateUserRoleDto } from "../dto/create-user-role.dto"; 

type SchemaUserRole = typeof userRoles.$inferSelect;

export class UserRoleMapper {

    static toDomain(raw: SchemaUserRole): UserRole {
        return raw as UserRole;
    }

    static toUserRole(dto: CreateUserRoleDto): UserRole {
        return {
            ...dto
        } as UserRole;
    }

    static toPersistence(userRole: UserRole) {
        return {
            id: userRole.id,
            userId: userRole.userId,
            roleId: userRole.roleId,
            version: userRole.version,
            createdAt: userRole.createdAt,
            updatedAt: userRole.updatedAt,
            deletedAt: userRole.deletedAt,
        };
    }

}