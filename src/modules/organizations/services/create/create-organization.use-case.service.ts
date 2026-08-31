import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { IOrganizationRepository } from "../../repository/iorganization.repository";
import { CreateOrganizationDto } from "../../dto/request/create-organization.dto";
import { OrganizationMapper } from "../../mapper/organization.mapper";
import { OrganizationEntity } from "../../entities/organization.entity";
import { Result } from "src/common/result/result";

@Injectable()
export class CreateOrganizationUseCase {
    constructor(
        private readonly repository: IOrganizationRepository
    ){}

    async execute(dto: CreateOrganizationDto, userId: string): Promise<Result<OrganizationEntity>> {
        const org: OrganizationEntity = OrganizationMapper.create(dto, userId);

        try {
            const saved: OrganizationEntity = await this.repository.create(org);

            return Result.created(saved);
        } catch (error: any) {
            const pgError = error?.cause || error;

            const code: string = pgError?.code || '';
            const detail: string = pgError?.detail || '';
            const constraint: string = pgError?.constraint_name || pgError?.constraint || '';
            const message: string = pgError?.message || error?.message || '';

            switch (code) {
                case '23505': {
                    if (
                        constraint.includes('uk_name_organization') ||
                        detail.includes('(name)=')
                    ) {
                        return Result.conflict(`Name: '${dto.name}' already exists`);
                    }
                    
                    if (
                        constraint.includes('uk_slug_organization') ||
                        detail.includes('(slug)=')
                    ) {
                        return Result.conflict(`Slug: '${dto.slug}' already exists`);
                    }
                    
                    return Result.conflict('Data conflict detected.');
                }

                case '23503': {
                    if (
                        constraint.includes('organizations_user_id_users_id_fk') ||
                        detail.includes('user_id') ||
                        message.includes('organizations_user_id_users_id_fk')
                    ) {
                        return Result.notFound(`The specified User does not exist.`);
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

                default:
                    throw new InternalServerErrorException('Error creating organization.');
            }
        }
    }
}