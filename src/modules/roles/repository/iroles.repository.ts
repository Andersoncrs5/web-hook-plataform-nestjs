import { Page, Pageable } from "src/common/page/page";
import { RoleFilter } from "../dto/role-filter.dto";
import { RoleSort } from "../dto/role-sort.dto";
import { Role } from "../entities/role.entity";

export abstract class IRoleRepository {
    abstract findAll(filter: RoleFilter, pageable: Pageable<RoleSort>): Promise<Page<Role>>

    abstract deleteById(id: string): Promise<boolean>;

    abstract update(user: Role): Promise<Role>;

    abstract findById(id: string): Promise<Role | null>;

    abstract create(Role: Role): Promise<Role>;

    abstract existsByName(name: string): Promise<boolean>;
}