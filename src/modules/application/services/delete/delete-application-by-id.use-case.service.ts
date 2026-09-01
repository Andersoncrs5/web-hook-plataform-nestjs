import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { IApplicationRepository } from "../../repository/iapplication.repository";
import { Result } from "src/common/result/result";

@Injectable()
export class DeleteApplicationByIdUseCase {
    constructor(
        private readonly repository: IApplicationRepository
    ) {}

    async execute(id: string, userId: string): Promise<Result<void>> {
        const app = await this.repository.findById(id);

        if (!app) {
            return Result.notFound('Application not found');
        }

        if (app.createdBy && app.createdBy !== userId) {
            return Result.forb("You do not own this application!");
        }

        try {
            const deletedCount = await this.repository.deleteByIdAndCount(id);

            if (deletedCount === 0) {
                return Result.notFound('Application not found');
            }

            return Result.ok();
        } catch (error: any) {
            const pgError = error?.cause || error;
            const code: string = pgError?.code || '';
            const constraint: string = pgError?.constraint_name || pgError?.constraint || '';

            if (code === '23503') {
                return Result.badRequest('Cannot delete application because it is referenced by other resources.');
            }

            throw new InternalServerErrorException('Error deleting application.');
        }
    }
}