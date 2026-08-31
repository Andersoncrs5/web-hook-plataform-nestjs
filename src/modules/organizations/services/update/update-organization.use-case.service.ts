import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { IOrganizationRepository } from "../../repository/iorganization.repository";
import { UpdateOrganizationDto } from "../../dto/request/update-organization.dto";
import { OrganizationEntity } from "../../entities/organization.entity";
import { isUUID } from "class-validator";
import { Result } from "src/common/result/result";
import { OrganizationMapper } from "../../mapper/organization.mapper";

@Injectable()
export class UpdateOrganizationUseCase {
    constructor(
        private readonly repository: IOrganizationRepository
    ) {}

    async execute(id: string, dto: UpdateOrganizationDto, userId: string): Promise<Result<OrganizationEntity>> {
        if (!isUUID(id)) return Result.badRequest('Id should be a UUID');
        if (!isUUID(userId)) return Result.badRequest('User Id should be a UUID');

        const org: OrganizationEntity | null = await this.repository.findById(id);

        if (org == null) {
            return Result.notFound("Organization not found");
        }

        OrganizationMapper.merge(org, dto);

        try {
            const saved = await this.repository.update(org);

            return Result.ok(saved);
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
                    throw new InternalServerErrorException('Error updating organization.');
            }
        }
    }
}