import { Injectable, InternalServerErrorException } from "@nestjs/common";

import { IUserRoleRepository } from "../../repository/iuser-role.repository";
import { Result } from "src/common/result/result";

@Injectable()
export class FindAllRoleNamesByUserIdUseCase {

    constructor(
        private readonly repository: IUserRoleRepository,
    ) {}

    async execute(userId: string): Promise<Result<string[]>> {
        try {
            const roleNames = await this.repository.findAllRoleNamesByUserId(userId);

            return Result.ok(roleNames);

        } catch (error) {
            throw new InternalServerErrorException(
                "An unexpected error occurred while finding user role names.",
            );
        }
    }
}