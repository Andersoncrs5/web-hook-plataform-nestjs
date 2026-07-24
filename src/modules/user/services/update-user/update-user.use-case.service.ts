import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { IUserRepository } from "../../repository/iuser.repository";
import { Result } from "src/common/result/result";
import { UpdateUserDto } from "../../dto/update-user.dto";
import { User } from "../../entities/user.entity";
import { PasswordService } from "src/common/crypto/password.service";
import { UserMapper } from "../../mapper/user.mapper";

@Injectable()
export class UpdateUserUseCase {
    constructor(
        private readonly userRepository: IUserRepository,
        private readonly passwordService: PasswordService,
    ) {}

    async execute(user: User, dto: UpdateUserDto): Promise<Result<User>> {
        if (dto.password) {
            user.passwordHash = await this.passwordService.hash(dto.password);
        }

        UserMapper.merge(user, dto);
        
        try {
            const updated = await this.userRepository.update(user);
            
            return Result.ok(updated);
        } catch (error: any) {
            switch (error.code) {
                case '23505': {
                    const detail: string = error.detail || '';
                    if (detail.includes('uk_name_user')) {
                        return Result.conflict(`Name "${dto.name}" already exists.`);
                    }
                    if (detail.includes('uk_email_user')) {
                        return Result.conflict(`Email "${dto.email}" already exists.`);
                    }
                    return Result.conflict('Data conflict detected.');
                }

                case '23502': {
                    const missingField = error.column || 'unknown field';
                    return Result.badRequest(`The field "${missingField}" cannot be null.`);
                }

                case '22001': {
                    return Result.badRequest('One or more fields exceed the maximum allowed length (e.g., 100 characters for name or 255 for email).');
                }

                default:
                    throw new InternalServerErrorException('Error updating user.');
            }
        }
    }
}