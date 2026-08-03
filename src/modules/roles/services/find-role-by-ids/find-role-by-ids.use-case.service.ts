import { Injectable } from "@nestjs/common";
import { Result } from "src/common/result/result";
import { IRoleRepository } from "../../repository/iroles.repository";
import { Role } from "../../entities/role.entity";
import { isUUID } from "class-validator";

@Injectable()
export class FindRoleByIds {
    constructor(
        private readonly roleRepository: IRoleRepository,
    ) {}

    async execute(ids: string[], limit: number = 50): Promise<Result<Role[]>> {
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return Result.badRequest("Ids is empty");
        }

        const hasInvalidUuid = ids.some((id) => !isUUID(id));
        if (hasInvalidUuid) {
            return Result.badRequest("All ids should be valid UUIDs");
        }

        const roles = await this.roleRepository.findByIds(ids, limit);

        return Result.ok(roles);
    }
}