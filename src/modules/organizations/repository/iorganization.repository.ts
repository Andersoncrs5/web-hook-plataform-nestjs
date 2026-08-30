import { Page, Pageable } from "src/common/page/page";
import { OrganizationFilter } from "../dto/page/organization-filter.dto";
import { OrganizationEntity } from "../entities/organization.entity";
import { OrganizationSort } from "../dto/page/organization-sort.dto";

export abstract class IOrganizationRepository {
    abstract findAll(
        filter: OrganizationFilter,
        pageable: Pageable<OrganizationSort>,
    ): Promise<Page<OrganizationEntity>>

    abstract deleteById(id: string): Promise<boolean>;

    abstract existsByName(name: string): Promise<boolean>;
    abstract existsBySlug(slug: string): Promise<boolean>;

    abstract update(user: OrganizationEntity): Promise<OrganizationEntity>;
    abstract create(user: OrganizationEntity): Promise<OrganizationEntity>;

    abstract findById(id: string): Promise<OrganizationEntity | null>;
}