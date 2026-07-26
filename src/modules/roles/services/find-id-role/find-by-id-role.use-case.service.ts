import { Injectable } from "@nestjs/common";
import { IRoleRepository } from "../../repository/iroles.repository";
import { Result } from "src/common/result/result";
import { Role } from "../../entities/role.entity";

@Injectable()
export class FindByIdRoleUseCase {
    constructor(
        private readonly roleRepository: IRoleRepository,
    ) {}

    async execute(id: string): Promise<Result<Role>> {
        const role = await this.roleRepository.findById(id);

        if (!role) {
            return Result.notFound('Role not found');
        }

        return Result.ok(role);
    }
}