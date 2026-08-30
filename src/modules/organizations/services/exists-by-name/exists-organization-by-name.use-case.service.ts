import { Injectable } from "@nestjs/common";
import { IOrganizationRepository } from "../../repository/iorganization.repository";
import { Result } from "src/common/result/result";

@Injectable()
export class ExistsOrganizationByNameUseCase {
    constructor(
        private readonly repository: IOrganizationRepository
    ) {}

    async execute(name: string): Promise<Result<boolean>> {
        if (!name || name.trim() === '') {
            return Result.badRequest('Name cannot be empty');
        }

        const exists = await this.repository.existsByName(name);
        return Result.ok(exists);
    }
}