import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { IApplicationRepository } from '../../repository/iapplication.repository';
import { CreateApplicationDto } from '../../dto/request/create-application.dto';
import { FindOrganizationByIdUseCase } from 'src/modules/organizations/services/find-by-id/find-organization-by-id.use-case.service';
import { Result } from 'src/common/result/result';
import { ApplicationMapper } from '../../mapper/application.mapper';
import { ApplicationEntity } from '../../entities/application.entity';

@Injectable()
export class CreateApplicationUseCase {
  constructor(
    private readonly repository: IApplicationRepository,
    private readonly findOrg: FindOrganizationByIdUseCase,
  ) {}

  async execute(
    dto: CreateApplicationDto,
    userId: string,
  ): Promise<Result<ApplicationEntity>> {
    const orgResult = await this.findOrg.execute(dto.organizationId);
    if (orgResult.isFailure)
      return Result.failure(orgResult.errors, orgResult.status);

    const org = orgResult.value;

    if (org.userId !== userId) {
      return Result.forb('You do not own this org!');
    }

    try {
      const application = ApplicationMapper.toApplication(dto, userId);

      const created = await this.repository.create(application);

      return Result.created(created);
    } catch (error: any) {
      const pgError = error?.cause || error;

      const code: string = pgError?.code || '';
      const detail: string = pgError?.detail || '';
      const constraint: string =
        pgError?.constraint_name || pgError?.constraint || '';
      const message: string = pgError?.message || error?.message || '';

      switch (code) {
        case '23505': {
          if (
            constraint.includes('uk_applications_organization_name') ||
            constraint.includes('uk_applications_name') ||
            detail.includes('(name)=')
          ) {
            return Result.conflict(
              `Application name '${dto.name}' already exists.`,
            );
          }

          if (
            constraint.includes('uk_applications_organization_slug') ||
            constraint.includes('uk_applications_slug') ||
            detail.includes('(slug)=')
          ) {
            return Result.conflict(
              `Application slug '${dto.slug}' already exists.`,
            );
          }

          return Result.conflict('Application data conflict detected.');
        }

        case '23503': {
          if (
            constraint.includes('applications_organization_id_fkey') ||
            detail.includes('organization_id')
          ) {
            return Result.notFound(
              `The specified Organization does not exist.`,
            );
          }

          if (
            constraint.includes('applications_created_by_fkey') ||
            detail.includes('created_by')
          ) {
            return Result.notFound(`The specified User does not exist.`);
          }

          if (
            constraint.includes('organizations_user_id_users_id_fk') ||
            detail.includes('created_by')
          ) {
            return Result.notFound(`The specified User does not exist.`);
          }

          return Result.badRequest('Related record not found.');
        }

        case '23502': {
          const missingField = pgError?.column || 'unknown field';
          return Result.badRequest(
            `The field "${missingField}" cannot be null.`,
          );
        }

        case '22001': {
          return Result.badRequest(
            'One or more fields exceed the maximum allowed length.',
          );
        }

        case '22P02': {
          return Result.badRequest('Invalid input format or enum value.');
        }

        default:
          throw new InternalServerErrorException('Error creating application.');
      }
    }
  }
}
