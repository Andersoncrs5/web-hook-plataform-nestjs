import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { IRoleRepository } from "../../repository/iroles.repository";
import { Result } from "src/common/result/result";
import { UpdateRoleDto } from "../../dto/update-role.dto";
import { Role } from "../../entities/role.entity";
import { RoleMapper } from "../../mapper/role.mapper";

@Injectable()
export class UpdateRoleUseCase {
    constructor(
        private readonly roleRepository: IRoleRepository,
    ) {}

    async execute(role: Role, dto: UpdateRoleDto): Promise<Result<Role>> {
        RoleMapper.merge(role, dto);
        
        try {
            const updated = await this.roleRepository.update(role);
            
            return Result.ok(updated);
        } catch (error: any) {
            switch (error.code) {
                case '23505': {
                    const detail: string = error.detail || '';
                    if (detail.includes('uk_name_role')) {
                        return Result.conflict(`Name "${dto.name}" already exists.`);
                    }
                    return Result.conflict('Data conflict detected.');
                }

                case '23502': {
                    const missingField = error.column || 'unknown field';
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