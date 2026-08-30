import { applications } from 'src/infra/database/schema/applications.schema';
import { UpdateApplicationDto } from '../dto/request/update-application.dto';
import { ApplicationEntity } from '../entities/application.entity';
import { CreateApplicationDto } from '../dto/request/create-application.dto';
import { ApplicationDto } from '../dto/response/application.dto';
import {
  ApplicationEnvironmentEnum,
  ApplicationStatusEnum,
  ApplicationTypeEnum,
} from 'src/common/enums/application/application.enums';

type SchemaApplication = typeof applications.$inferSelect;

export class ApplicationMapper {
  static merge(
    application: ApplicationEntity,
    dto: UpdateApplicationDto,
  ): void {
    const updatableFields = Object.fromEntries(
      Object.entries(dto).filter(([_, value]) => value !== undefined),
    );

    Object.assign(application, updatableFields);
  }

  static toDomain(raw: SchemaApplication): ApplicationEntity {
    return {
      id: raw.id,
      organizationId: raw.organizationId,
      createdBy: raw.createdBy,
      name: raw.name,
      slug: raw.slug,
      type: raw.type as ApplicationTypeEnum,
      environment: raw.environment as ApplicationEnvironmentEnum,
      status: raw.status as ApplicationStatusEnum,
      logoUrl: raw.logoUrl,
      homepageUrl: raw.homepageUrl,
      description: raw.description,
      metadata: (raw.metadata as Record<string, any>) ?? null,
      rateLimit: raw.rateLimit,
      version: raw.version,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      deletedAt: raw.deletedAt,
    };
  }

  static toApplication(
    dto: CreateApplicationDto,
    createdBy?: string,
  ): ApplicationEntity {
    const application = {
      ...dto,
      createdBy: createdBy ?? null,
    } as ApplicationEntity;

    return application;
  }

  static toPersistence(application: ApplicationEntity) {
    return {
      id: application.id,
      organizationId: application.organizationId,
      createdBy: application.createdBy,
      name: application.name,
      slug: application.slug,
      type: application.type,
      environment: application.environment,
      status: application.status,
      logoUrl: application.logoUrl,
      homepageUrl: application.homepageUrl,
      description: application.description,
      metadata: application.metadata,
      rateLimit: application.rateLimit,
      version: application.version,
    };
  }

  static toDto(application: ApplicationEntity): ApplicationDto {
    return {
      ...application,
    };
  }
}
