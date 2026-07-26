import { Injectable } from "@nestjs/common";
import { Result } from "src/common/result/result";
import { IUserRoleRepository } from "../../repository/iuser-role.repository";
import { isUUID } from "class-validator";

@Injectable()
export class DeleteUserRoleByIdUseCase {
    constructor(
        private readonly userRoleRepository: IUserRoleRepository,
    ) {}

    async execute(id: string): Promise<Result<void>> {
        if (!isUUID(id)) {
            return Result.badRequest('Id should be a UUID');
        }

        const result = await this.userRoleRepository.deleteById(id);
        if (result === false) {
            return Result.notFound('User role not found');
        }

        return Result.ok();
    }
}