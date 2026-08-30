import { Injectable } from "@nestjs/common";
import { IUserRepository } from "../../repository/iuser.repository";
import { Result } from "src/common/result/result";

@Injectable()
export class ExistsUserByNameUseCase {
    constructor(
        private readonly userRepository: IUserRepository,
    ) {}

    async execute(name: string): Promise<Result<boolean>> {
        const result = await this.userRepository.existsByName(name)

        return Result.ok(result);
    }

}