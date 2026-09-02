import { Module } from '@nestjs/common';
import { ApiKeyController } from './controller/api-key.controller';
import { ApiKeyRepository } from './repository/api-key.repository';
import { IApiKeyRepository } from './repository/iapi-key.repository';
import { ApplicationModule } from '../application/application.module';

import { CreateApiKeyUseCase } from './services/create/create-api-key.use-case.service';
import { DeleteApiKeyByIdUseCase } from './services/delete/delete-api-key-by-id.use-case.service';
import { ExistsApiKeyByApplicationIdAndNameUseCase } from './services/exists-api-key-by-application-id-and-name/exists-api-key-by-application-id-and-name.use-case.service';
import { ExistsApiKeyByIdUseCase } from './services/exists-by-id/exists-api-key-by-id.use-case.service';
import { ExistsApiKeyByNameUseCase } from './services/exists-name/exists-api-key-by-name.use-case.service';
import { FindAllApiKeysUseCase } from './services/find-all/find-all-api-keys.use-case.service';
import { FindAllApiKeysByApplicationIdUseCase } from './services/find-all-application-id/find-all-api-keys-by-application-id.use-case.service';
import { FindApiKeyByIdUseCase } from './services/find-by-id/find-api-key-by-id.use-case.service';
import { UpdateApiKeyUseCase } from './services/update/update-api-key.use-case.service';
import { CountApiKeysByApplicationIdUseCase } from './services/count-api-keys-by-application-id/count-api-keys-by-application-id.use-case.service';
import { RotateApiKeyUseCase } from './services/rotate/rotate-api-key.use-case.service';
import { ValidateApiKeyUseCase } from './services/validate-api-key/validate-api-key.use-case.service';

const USE_CASES = [
  CreateApiKeyUseCase,
  DeleteApiKeyByIdUseCase,
  ExistsApiKeyByApplicationIdAndNameUseCase,
  ExistsApiKeyByIdUseCase,
  ExistsApiKeyByNameUseCase,
  FindAllApiKeysUseCase,
  FindAllApiKeysByApplicationIdUseCase,
  FindApiKeyByIdUseCase,
  UpdateApiKeyUseCase,
  CountApiKeysByApplicationIdUseCase,
  RotateApiKeyUseCase,
  ValidateApiKeyUseCase,
];

@Module({
  imports: [ApplicationModule],
  controllers: [ApiKeyController],
  providers: [
    ApiKeyRepository,
    {
      provide: IApiKeyRepository,
      useExisting: ApiKeyRepository,
    },
    ...USE_CASES,
  ],
  exports: [ApiKeyRepository, IApiKeyRepository, ...USE_CASES],
})
export class ApiKeyModule {}
