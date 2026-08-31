import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { IApplicationRepository } from "../../repository/iapplication.repository";
import { isUUID } from "class-validator";
import { Result } from "src/common/result/result";
import { ApplicationEntity } from "../../entities/application.entity";

@Injectable()
export class FindApplicationByIdUseCase {
    constructor(
        private readonly repository: IApplicationRepository
    ) {}

    async execute(id: string): Promise<Result<ApplicationEntity>> {
        if (!isUUID(id)) {
            return Result.badRequest('Id should be a valid UUID');
        }

        try {
            const app = await this.repository.findById(id);

            if (!app) {
                return Result.notFound('Application not found');
            }

            return Result.ok(app);
        } catch (error) {
            throw new InternalServerErrorException('Error finding application.');
        }
    }
}