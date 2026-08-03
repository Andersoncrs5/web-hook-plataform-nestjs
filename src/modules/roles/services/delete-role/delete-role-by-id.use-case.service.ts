import { Injectable } from "@nestjs/common";
import { Result } from "src/common/result/result";
import { IRoleRepository } from "../../repository/iroles.repository";
import { isUUID } from "class-validator";

@Injectable()
export class DeleteRoleByIdUseCase {
    constructor(
        private readonly roleRepository: IRoleRepository,
    ) {}

    async execute(id: string): Promise<Result<void>> {
        if (!isUUID(id)) return Result.badRequest('Id should be a UUID');

        const result = await this.roleRepository.deleteById(id)
        if (result === false) {
            return Result.notFound('Role not found')
        }

        return Result.ok();
    }

}