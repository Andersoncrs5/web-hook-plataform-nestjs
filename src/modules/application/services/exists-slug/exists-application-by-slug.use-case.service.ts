import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { IApplicationRepository } from "../../repository/iapplication.repository";
import { Result } from "src/common/result/result";

@Injectable()
export class ExistsApplicationBySlugUseCase {
    constructor(
        private readonly repository: IApplicationRepository
    ) {}

    async execute(slug: string): Promise<Result<boolean>> {
        if (!slug || slug.trim().length === 0) {
            return Result.badRequest("Slug cannot be empty");
        }

        try {
            const exists = await this.repository.existsBySlug(slug.trim());
            return Result.ok(exists);
        } catch (error) {
            throw new InternalServerErrorException("Error checking if application exists by slug.");
        }
    }
}