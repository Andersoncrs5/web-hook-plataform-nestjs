import { Injectable } from "@nestjs/common";
import { IUserRepository } from "../../repository/iuser.repository";
import { isEmail } from "class-validator";
import { Result } from "src/common/result/result";
import { User } from "../../entities/user.entity";

@Injectable()
export class FindUserByEmailUseCase {
    constructor (
        private readonly repository: IUserRepository
    ){}

    async execute(email: string): Promise<Result<User>> {
        if (!isEmail(email)) return Result.badRequest('Email invalid')

        const user: User | null = await this.repository.findByEmail(email)

        if (user == null) return Result.notFound('User not found')

        return Result.ok(user)
    }

}