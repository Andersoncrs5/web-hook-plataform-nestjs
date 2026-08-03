import { CreateRoleDto } from "../../dto/create-role.dto";
import { Role } from "../../entities/role.entity";
import { IRoleRepository } from "../../repository/iroles.repository";
import { RoleMapper } from "../../mapper/role.mapper";
import { CryptoService } from "src/common/crypto/crypto.service";
import { Result } from "src/common/result/result";
import { InternalServerErrorException, Injectable } from "@nestjs/common";

@Injectable()
export class CreateRoleUseCase {
    constructor(
        private readonly roleRepository: IRoleRepository,
        private readonly cryptoService: CryptoService,
    ) {}

    async execute(dto: CreateRoleDto): Promise<Result<Role>> {
        const role = RoleMapper.toRole(dto);
        role.id = this.cryptoService.generateUuid();

        try {
            const created = await this.roleRepository.create(role);

            return Result.created(created);
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
                    // Corrigido a mensagem genérica
                    throw new InternalServerErrorException('Error creating role.');
            }
        }
    }
}