import { Page, Pageable } from "src/common/page/page";
import { UserRoleFilter } from "../dto/user-role-filter.dto";
import { UserRole } from "../entities/user-role.entity";
import { UserRoleSort } from "../dto/user-role-sort.dto";
import { Role } from "src/modules/roles/entities/role.entity";

export abstract class IUserRoleRepository {
    abstract findAll(filter: UserRoleFilter, pageable: Pageable<UserRoleSort>): Promise<Page<UserRole>>

    abstract deleteById(id: string): Promise<boolean>;

    abstract update(user: UserRole): Promise<UserRole>;

    abstract findById(id: string): Promise<UserRole | null>;

    abstract create(user: UserRole): Promise<UserRole>;

    abstract existsByRoleIdAndUserId(roleId: string, userId: string): Promise<boolean>;

    abstract findAllByUserIdJustRoleId(userId: string): Promise<string[]>;

    abstract findAllRolesByUserId(userId: string): Promise<Role[]>;

    abstract findAllRoleNamesByUserId(userId: string): Promise<string[]>;
}