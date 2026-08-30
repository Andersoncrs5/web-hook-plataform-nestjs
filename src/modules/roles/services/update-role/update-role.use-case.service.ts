import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { IRoleRepository } from "../../repository/iroles.repository";
import { Result } from "src/common/result/result";
import { UpdateRoleDto } from "../../dto/update-role.dto";
import { Role } from "../../entities/role.entity";
import { RoleMapper } from "../../mapper/role.mapper";
import { isUUID } from "class-validator";

@Injectable()
export class UpdateRoleUseCase {
    constructor(
        private readonly roleRepository: IRoleRepository,
    ) {}

    async execute(id: string, dto: UpdateRoleDto): Promise<Result<Role>> {
        if (!isUUID(id)) return Result.badRequest('Id should be a UUID');
        
        const role = await this.roleRepository.findById(id);

        if (!role) {
            return Result.notFound('Role not found');
        }

        RoleMapper.merge(role, dto);
        
        try {
            const updated = await this.roleRepository.update(role);
            
            return Result.ok(updated);
        } catch (error: any) {
            const dbError = error?.cause || error;
            const code = dbError?.code;
            const detail: string = dbError?.detail || '';
            const constraint: string = dbError?.constraint_name || '';

            switch (code) {
                case '23505': {
                    if (constraint.includes('uk_name_role') || detail.includes('uk_name_role')) {
                        return Result.conflict(`Name "${dto.name}" already exists.`);
                    }
                    return Result.conflict('Data conflict detected.');
                }

                case '23502': {
                    const missingField = dbError.column || 'unknown field';
                    return Result.badRequest(`The field "${missingField}" cannot be null.`);
                }

                case '22001': {
                    return Result.badRequest('One or more fields exceed the maximum allowed length (e.g., 100 characters for name or 255 for description).');
                }

                default:
                    throw new InternalServerErrorException('Error updating role.');
            }
        }
    }
}