import { Module } from '@nestjs/common';
import { OrganizationsController } from './controller/organizations.controller';
import { IOrganizationRepository } from './repository/iorganization.repository';
import { OrganizationRepository } from './repository/organization.repository';

import { CreateOrganizationUseCase } from './services/create/create-organization.use-case.service';
import { FindOrganizationByIdUseCase } from './services/find-by-id/find-organization-by-id.use-case.service';
import { UpdateOrganizationUseCase } from './services/update/update-organization.use-case.service';
import { FindAllOrganizationUseCase } from './services/find-all/find-all-organization.use-case.service';
import { ExistsOrganizationByNameUseCase } from './services/exists-by-name/exists-organization-by-name.use-case.service';
import { DeleteOrganizationByIdUseCase } from './services/delete-by-id/delete-organization-by-id.use-case.service';
import { ExistsOrganizationBySlugUseCase } from './services/exists-slug/exists-organization-by-slug.use-case.service';

const USE_CASES = [
  CreateOrganizationUseCase,
  FindOrganizationByIdUseCase,
  UpdateOrganizationUseCase,
  DeleteOrganizationByIdUseCase,
  FindAllOrganizationUseCase,
  ExistsOrganizationByNameUseCase,
  ExistsOrganizationBySlugUseCase,
];

@Module({
  controllers: [OrganizationsController],
  providers: [
    OrganizationRepository,
    {
      provide: IOrganizationRepository,
      useExisting: OrganizationRepository,
    },
    ...USE_CASES,
  ],
  exports: [
    OrganizationRepository,
    IOrganizationRepository,
    ...USE_CASES,
  ],
})
export class OrganizationsModule {}