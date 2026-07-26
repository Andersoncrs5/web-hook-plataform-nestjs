import { Injectable } from "@nestjs/common";

import { Result } from "src/common/result/result";
import { Page, Pageable } from "src/common/page/page";

import { IRoleRepository } from "../../repository/iroles.repository";
import { Role } from "../../entities/role.entity";
import { RoleSort } from "../../dto/role-sort.dto";
import { RoleFilter } from "../../dto/role-filter.dto";

@Injectable()
export class FindAllRoleUseCase {

    constructor(
        private readonly roleRepository: IRoleRepository,
    ) {}

    async execute(
        filter: RoleFilter,
        pageable: Pageable<RoleSort>,
    ): Promise<Result<Page<Role>>> {

        const page = await this.roleRepository.findAll(
            filter,
            pageable,
        );

        return Result.ok(page);
    }

}