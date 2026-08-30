import { Injectable } from "@nestjs/common";
import { IOrganizationRepository } from "../../repository/iorganization.repository";
import { Result } from "src/common/result/result";

@Injectable()
export class ExistsOrganizationBySlugUseCase {
    constructor(
        private readonly repository: IOrganizationRepository
    ) {}

    async execute(slug: string): Promise<Result<boolean>> {
        if (!slug || slug.trim() === '') {
            return Result.badRequest('Slug cannot be empty');
        }

        const exists = await this.repository.existsBySlug(slug);
        return Result.ok(exists);
    }
}