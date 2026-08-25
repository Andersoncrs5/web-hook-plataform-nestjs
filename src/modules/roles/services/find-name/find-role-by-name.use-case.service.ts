import { Injectable } from "@nestjs/common";
import { IRoleRepository } from "../../repository/iroles.repository";
import { Result } from "src/common/result/result";
import { Role } from "../../entities/role.entity";

@Injectable()
export class FindRoleByNameUseCase {
    constructor(
        private readonly roleRepository: IRoleRepository,
    ) {}

    async execute(name: string): Promise<Result<Role>> {
        if (!name || typeof name !== 'string' || name.trim().length === 0) 
            return Result.badRequest('Role name is required');
            
        const exists = await this.roleRepository.findByName(name);
        
        if (exists == null) return Result.notFound("Role not found");

        return Result.ok(exists);
    }
}