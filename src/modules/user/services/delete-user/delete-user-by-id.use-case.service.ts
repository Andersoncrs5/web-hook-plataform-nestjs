import { Injectable } from "@nestjs/common";
import { IUserRepository } from "../../repository/iuser.repository";
import { Result } from "src/common/result/result";

@Injectable()
export class DeleteByIdUserUseCase {
    constructor(
        private readonly userRepository: IUserRepository,
    ) {}

    async execute(id: string) {
        const result = await this.userRepository.deleteById(id);

        if (result === false) {
            return Result.notFound('User not found')
        }

        return Result.ok();
    }

}