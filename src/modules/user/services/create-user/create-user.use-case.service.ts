import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { Result } from "src/common/result/result";
import { CreateUserDto } from "../../dto/create-user.dto";
import { User } from "../../entities/user.entity";
import { IUserRepository } from "../../repository/iuser.repository";
import { PasswordService } from "src/common/crypto/password.service";
import { CryptoService } from "src/common/crypto/crypto.service";

@Injectable()
export class CreateUserUseCase {
    constructor(
        private readonly userRepository: IUserRepository,
        private readonly passwordService: PasswordService,
        private readonly cryptoService: CryptoService,
    ) {}

    async execute(dto: CreateUserDto): Promise<Result<User>> {
        const passwordHash = await this.passwordService.hash(dto.password);

        const user = User.create({
            id: this.cryptoService.generateUuid(),
            name: dto.name,
            fullName: dto.fullName,
            email: dto.email,
            passwordHash,
        });

        try {
            const created = await this.userRepository.create(user);
            
            return Result.created(created);
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
                    throw new InternalServerErrorException('Error creating user.');
            }
        }
    }
}