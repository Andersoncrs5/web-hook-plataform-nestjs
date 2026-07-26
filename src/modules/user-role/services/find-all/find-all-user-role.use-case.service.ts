import { Injectable } from "@nestjs/common";

import { Result } from "src/common/result/result";
import { Page, Pageable } from "src/common/page/page";

import { IUserRoleRepository } from "../../repository/iuser-role.repository";
import { UserRole } from "../../entities/user-role.entity";
import { UserRoleSort } from "../../dto/user-role-sort.dto";
import { UserRoleFilter } from "../../dto/user-role-filter.dto";

@Injectable()
export class FindAllUserRoleUseCase {

    constructor(
        private readonly userRoleRepository: IUserRoleRepository,
    ) {}

    async execute(
        filter: UserRoleFilter,
        pageable: Pageable<UserRoleSort>,
    ): Promise<Result<Page<UserRole>>> {

        const page = await this.userRoleRepository.findAll(
            filter,
            pageable,
        );

        return Result.ok(page);
    }

}