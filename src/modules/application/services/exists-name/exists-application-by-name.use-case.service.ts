import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { IApplicationRepository } from "../../repository/iapplication.repository";
import { Result } from "src/common/result/result";

@Injectable()
export class ExistsApplicationByNameUseCase {
    constructor(
        private readonly repository: IApplicationRepository
    ) {}

    async execute(name: string): Promise<Result<boolean>> {
        if (!name || name.trim().length === 0) {
            return Result.badRequest("Name cannot be empty");
        }

        try {
            const exists = await this.repository.existsByName(name.trim());
            return Result.ok(exists);
        } catch (error) {
            throw new InternalServerErrorException("Error checking if application exists by name.");
        }
    }
}