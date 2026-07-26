import { Injectable } from "@nestjs/common";
import { Result } from "src/common/result/result";
import { IUserRoleRepository } from "../../repository/iuser-role.repository";
import { isUUID } from "class-validator";

@Injectable()
export class ExistsByRoleIdAndUserIdUseCase {
    constructor(
        private readonly userRoleRepository: IUserRoleRepository,
    ) {}

    async execute(roleId: string, userId: string): Promise<Result<boolean>> {
        if (!isUUID(roleId)) {
            return Result.badRequest('RoleId should be a UUID');
        }

        if (!isUUID(userId)) {
            return Result.badRequest('UserId should be a UUID');
        }

        const exists = await this.userRoleRepository.existsByRoleIdAndUserId(roleId, userId);

        return Result.ok(exists);
    }
}