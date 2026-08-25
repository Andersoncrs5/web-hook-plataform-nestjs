import { Injectable } from "@nestjs/common";
import { IUserRepository } from "../../repository/iuser.repository";
import { Result } from "src/common/result/result";
import { isEmail } from "class-validator";

@Injectable()
export class ExistsUserByEmailUseCase {
    constructor(
        private readonly userRepository: IUserRepository,
    ) {}

    async execute(email: string): Promise<Result<boolean>> {
        if (!isEmail(email)) return Result.badRequest('Email invalid')

        const result = await this.userRepository.existsByEmail(email)

        return Result.ok(result);
    }

}