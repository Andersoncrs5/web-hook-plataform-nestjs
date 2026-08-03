import { Injectable } from "@nestjs/common";
import { IRoleRepository } from "../../repository/iroles.repository";
import { Result } from "src/common/result/result";

@Injectable()
export class CheckRoleExistsByNameUseCase {
    constructor(
        private readonly roleRepository: IRoleRepository,
    ) {}

    async execute(name: string): Promise<Result<boolean>> {
        if (!name || typeof name !== 'string' || name.trim().length === 0) 
            return Result.badRequest('Role name is required');
            
        const exists = await this.roleRepository.existsByName(name);
        
        return Result.ok(exists);
    }
}