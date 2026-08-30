import { Module } from '@nestjs/common';
import { ApplicationController } from './controller/application.controller';
import { ApplicationRepository } from './repository/application.repository';
import { IApplicationRepository } from './repository/iapplication.repository';
import { OrganizationsModule } from '../organizations/organizations.module';

import { CreateApplicationUseCase } from './services/create/create-application.use-case.service';
import { DeleteApplicationByIdUseCase } from './services/delete/delete-application-by-id.use-case.service';
import { ExistsApplicationByNameUseCase } from './services/exists-name/exists-application-by-name.use-case.service';
import { ExistsApplicationBySlugUseCase } from './services/exists-slug/exists-application-by-slug.use-case.service';
import { FindAllApplicationsUseCase } from './services/find-all/find-all-application.use-case.service';
import { FindApplicationByIdUseCase } from './services/find-by-id/find-application-by-id.use-case.service';
import { UpdateApplicationUseCase } from './services/update/update-application.use-case.service';

const USE_CASES = [
  CreateApplicationUseCase,
  DeleteApplicationByIdUseCase,
  ExistsApplicationByNameUseCase,
  ExistsApplicationBySlugUseCase,
  FindAllApplicationsUseCase,
  FindApplicationByIdUseCase,
  UpdateApplicationUseCase,
];

@Module({
  imports: [
    OrganizationsModule,
  ],
  controllers: [ApplicationController],
  providers: [
    ApplicationRepository,
    {
      provide: IApplicationRepository, 
      useExisting: ApplicationRepository,
    },
    ...USE_CASES,
  ],
  exports: [
    ApplicationRepository,
    IApplicationRepository,
    ...USE_CASES,
  ],
})
export class ApplicationModule {}