import { Injectable } from "@nestjs/common";
import { IUserRoleRepository } from "../../repository/iuser-role.repository";
import { Result } from "src/common/result/result";
import { isUUID } from "class-validator";

@Injectable()
export class FindUserRoleByUserIdUseCase {
    constructor(
        private readonly repository: IUserRoleRepository,
    ) {}

    async execute(userId: string): Promise<Result<string[]>> {
        if (!isUUID(userId)) return Result.badRequest('Id should be a UUID');
        
        const roleIds = await this.repository.findAllByUserIdJustRoleId(userId)

        return Result.ok(roleIds);
    }

}