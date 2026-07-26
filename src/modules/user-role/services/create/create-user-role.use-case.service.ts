import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { IUserRoleRepository } from "../../repository/iuser-role.repository";
import { CreateUserRoleDto } from "../../dto/create-user-role.dto";
import { UserRole } from "../../entities/user-role.entity";
import { Result } from "src/common/result/result";

@Injectable()
export class CreateUserRoleService {
    constructor(
        private readonly repository: IUserRoleRepository
    ) {}

    async execute(dto: CreateUserRoleDto): Promise<Result<UserRole>> {
        const entity = {
            ...dto
        } as UserRole;

        try {
            const saved = await this.repository.create(entity);            

            return Result.created(saved);
        } catch (error: any) {
            switch (error.code) {
                case '23505': {
                    const detail: string = error.detail || '';

                    if (detail.includes('uk_user_roles_user_id_role_id')) {
                        return Result.conflict('This user already has this role assigned.');
                    }
                    
                    return Result.conflict('Data conflict detected.');
                }

                case '23503': {
                    const detail: string = error.detail || '';

                    if (detail.includes('user_id')) {
                        return Result.notFound(`The specified User does not exist.`);
                    }
                    if (detail.includes('role_id')) {
                        return Result.notFound(`The specified Role does not exist.`);
                    }

                    return Result.badRequest('Related record not found.');
                }

                case '23502': {
                    const missingField = error.column || 'unknown field';
                    return Result.badRequest(`The field "${missingField}" cannot be null.`);
                }

                case '22001': {
                    return Result.badRequest('One or more fields exceed the maximum allowed length.');
                }

                default:
                    throw new InternalServerErrorException('Error assigning role to user.');
            }
        }
    }
}