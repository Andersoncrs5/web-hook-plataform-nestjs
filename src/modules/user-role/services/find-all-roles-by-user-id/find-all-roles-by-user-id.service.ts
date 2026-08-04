import { Injectable, InternalServerErrorException } from "@nestjs/common";

import { IUserRoleRepository } from "../../repository/iuser-role.repository";
import { Role } from "src/modules/roles/entities/role.entity";
import { Result } from "src/common/result/result";

@Injectable()
export class FindAllRolesByUserIdUseCase {

    constructor(
        private readonly repository: IUserRoleRepository,
    ) {}

    async execute(userId: string): Promise<Result<Role[]>> {
        try {
            const roles = await this.repository.findAllRolesByUserId(userId);

            return Result.ok(roles);

        } catch (error) {
            throw new InternalServerErrorException(
                "An unexpected error occurred while finding user roles.",
            );
        }
    }
}