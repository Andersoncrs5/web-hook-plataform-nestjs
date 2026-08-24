import { roles } from "src/infra/database/schema/roles.schema";
import { Role } from "../entities/role.entity";
import { CreateRoleDto } from "../dto/create-role.dto";
import { UpdateRoleDto } from "../dto/update-role.dto";

type SchemaRole = typeof roles.$inferSelect;

export class RoleMapper {

    static merge(user: Role, dto: UpdateRoleDto): void {
        const updatableFields = Object.fromEntries(
            Object.entries(dto).filter(([_, value]) => value !== undefined)
        );

        Object.assign(user, updatableFields);
    }

    static toDomain(raw: SchemaRole): Role {
        return raw;
    }

    static toRole(dto: CreateRoleDto): Role {
        return {
            ...dto
        } as Role
    }

    static toPersistence(role: Role) {

        return {
            id: role.id,
            name: role.name,
            description: role.description,
            isActive: role.isActive,
            version: role.version,
        };
    }

}