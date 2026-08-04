import { Injectable } from "@nestjs/common";
import { IUserRepository } from "../../repository/iuser.repository";
import { Result } from "src/common/result/result";
import { User } from "../../entities/user.entity";

@Injectable()
export class FindUserByIdUserUseCase {
    constructor(
        private readonly userRepository: IUserRepository,
    ) {}

    async execute(id: string): Promise<Result<User>> {
        const user = await this.userRepository.findById(id);

        if (!user) {
            return Result.notFound('User not found');
        }

        return Result.ok(user);
    }
}