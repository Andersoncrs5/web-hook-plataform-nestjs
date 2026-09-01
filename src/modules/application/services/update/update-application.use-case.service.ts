import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { IApplicationRepository } from "../../repository/iapplication.repository";
import { UpdateApplicationDto } from "../../dto/request/update-application.dto";
import { Result } from "src/common/result/result";
import { ApplicationEntity } from "../../entities/application.entity";
import { isUUID } from "class-validator";

@Injectable()
export class UpdateApplicationUseCase {
    constructor(
        private readonly repository: IApplicationRepository,
    ) {}

    async execute(
        id: string,
        dto: UpdateApplicationDto,
        userId: string,
    ): Promise<Result<ApplicationEntity>> {
        if (!isUUID(id)) return Result.badRequest('Id should be a valid UUID');
        if (!isUUID(userId)) return Result.badRequest('User Id should be a valid UUID');

        const existingApp = await this.repository.findById(id);

        if (!existingApp) return Result.notFound('Application not found');
        
        if (existingApp.createdBy && existingApp.createdBy !== userId) 
            return Result.forb('You do not own this application!');
        
        const updatedEntity: ApplicationEntity = Object.assign(
            new ApplicationEntity(),
            existingApp,
            dto,
        );

        try {
            const saved = await this.repository.update(updatedEntity);

            return Result.ok(saved);
        } catch (error: any) {
            const pgError = error?.cause || error;

            const code: string = pgError?.code || '';
            const detail: string = pgError?.detail || '';
            const constraint: string = pgError?.constraint_name || pgError?.constraint || '';

            switch (code) {
                case '23505': { 
                    if (
                        constraint.includes('uk_applications_organization_name') ||
                        constraint.includes('uk_applications_name') ||
                        detail.includes('(name)=')
                    ) {
                        return Result.conflict(
                            `Application name '${dto.name ?? existingApp.name}' already exists.`,
                        );
                    }

                    if (
                        constraint.includes('uk_applications_organization_slug') ||
                        constraint.includes('uk_applications_slug') ||
                        detail.includes('(slug)=')
                    ) {
                        return Result.conflict(
                            `Application slug '${dto.slug ?? existingApp.slug}' already exists.`,
                        );
                    }

                    return Result.conflict('Application data conflict detected.');
                }

                case '23503': { 
                    if (
                        constraint.includes('applications_organization_id_fkey') ||
                        detail.includes('organization_id')
                    ) {
                        return Result.notFound('The specified Organization does not exist.');
                    }

                    return Result.badRequest('Related record not found.');
                }

                case '23502': { 
                    const missingField = pgError?.column || 'unknown field';
                    return Result.badRequest(`The field "${missingField}" cannot be null.`);
                }

                case '22001': { 
                    return Result.badRequest('One or more fields exceed the maximum allowed length.');
                }

                case '22P02': { 
                    return Result.badRequest('Invalid input format or enum value.');
                }

                default:
                    throw new InternalServerErrorException('Error updating application.');
            }
        }
    }
}