import { Injectable } from "@nestjs/common";

import { Result } from "src/common/result/result";
import { Page, Pageable } from "src/common/page/page";

import { IUserRepository } from "../../repository/iuser.repository";
import { User } from "../../entities/user.entity";
import { UserFilter } from "../../dto/user-filter.filter";
import { UserSort } from "../../dto/user-sort.page";

@Injectable()
export class FindAllUserUseCase {

    constructor(
        private readonly userRepository: IUserRepository,
    ) {}

    async execute(
        filter: UserFilter,
        pageable: Pageable<UserSort>,
    ): Promise<Result<Page<User>>> {

        const page = await this.userRepository.findAll(
            filter,
            pageable,
        );

        return Result.ok(page);
    }

}