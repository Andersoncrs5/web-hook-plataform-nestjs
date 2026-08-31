import { Injectable } from "@nestjs/common";
import { IOrganizationRepository } from "../../repository/iorganization.repository";
import { OrganizationSort } from "../../dto/page/organization-sort.dto";
import { OrganizationFilter } from "../../dto/page/organization-filter.dto";
import { Page, Pageable } from "src/common/page/page";
import { OrganizationEntity } from "../../entities/organization.entity";

@Injectable()
export class FindAllOrganizationUseCase {
    constructor(
        private readonly repository: IOrganizationRepository
    ) {}

    async execute(
        filter: OrganizationFilter, 
        pageable: Pageable<OrganizationSort>
    ): Promise<Page<OrganizationEntity>> {
        return await this.repository.findAll(filter, pageable)
    }

}