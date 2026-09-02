import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { CreateApiKeyDto } from '../dto/request/create-api-key.dto';
import { UpdateApiKeyDto } from '../dto/request/update-api-key.dto';
import { ExistsApiKeyByNameUseCase } from '../services/exists-name/exists-api-key-by-name.use-case.service';
import { ResponseException } from 'src/utils/exceptions/classes/response.exception';
import { ExistsApiKeyByApplicationIdAndNameUseCase } from '../services/exists-api-key-by-application-id-and-name/exists-api-key-by-application-id-and-name.use-case.service';
import {
  CreateApiKeyResponse,
  CreateApiKeyUseCase,
} from '../services/create/create-api-key.use-case.service';
import { Payload } from 'src/modules/auth/classes/payload.class';
import { CurrentUser } from 'src/modules/auth/decorators/current-user.decorator';
import { ApiKeyMapper } from '../mapper/api-key.mapper';
import { Result } from 'src/common/result/result';
import { FindApiKeyByIdUseCase } from '../services/find-by-id/find-api-key-by-id.use-case.service';
import { ApiKeyEntity } from '../entities/api-key.entity';
import { UUIDParam } from 'src/common/parameters/uuid-param.parameter';
import { DeleteApiKeyByIdUseCase } from '../services/delete/delete-api-key-by-id.use-case.service';
import { ExistsApiKeyByIdUseCase } from '../services/exists-by-id/exists-api-key-by-id.use-case.service';
import { FindAllApiKeysUseCase } from '../services/find-all/find-all-api-keys.use-case.service';
import { ApiKeyFilterDto } from '../dto/filter/api-key.filter.dto';
import { ApiKeySort } from '../dto/filter/api-key-sort.dto';
import { Page, Pageable } from 'src/common/page/page';
import { CountApiKeysByApplicationIdUseCase } from '../services/count-api-keys-by-application-id/count-api-keys-by-application-id.use-case.service';
import { JwtGuard } from 'src/common/guards/guards/auth/auth-guards.guard';
import { ApiKeyDto } from '../dto/response/api-key.dto';
import {
  RotateApiKeyResponse,
  RotateApiKeyUseCase,
} from '../services/rotate/rotate-api-key.use-case.service';

@UseGuards(JwtGuard)
@Controller('v1/api-key')
export class ApiKeyController {
  constructor(
    private readonly existsByName: ExistsApiKeyByNameUseCase,
    private readonly existsByNameAndAppId: ExistsApiKeyByApplicationIdAndNameUseCase,
    private readonly createApiKey: CreateApiKeyUseCase,
    private readonly findById: FindApiKeyByIdUseCase,
    private readonly deleteById: DeleteApiKeyByIdUseCase,
    private readonly existsById: ExistsApiKeyByIdUseCase,
    private readonly findAll: FindAllApiKeysUseCase,
    private readonly countByApplicationId: CountApiKeysByApplicationIdUseCase,
    private readonly rotateApiKey: RotateApiKeyUseCase,
  ) {}

  @Patch(':id/rotate')
  async rotate(
    @CurrentUser() payload: Payload,
    @UUIDParam('id') id: string,
  ): Promise<{ apiKey: ApiKeyDto; key: string }> {
    const result: Result<RotateApiKeyResponse> = await this.rotateApiKey.execute(id, payload.sub);

    if (result.isFailure) {
      throw new ResponseException(result.errors[0], result.status);
    }

    return {
      apiKey: ApiKeyMapper.toDto(result.value.apiKey),
      key: result.value.rawKey,
    };
  }

  @Get()
  async findAllHttp(
    @Query() filter: ApiKeyFilterDto,
    @Query() pageable: Pageable<ApiKeySort>,
  ): Promise<Page<ApiKeyDto>> {
    const result = await this.findAll.execute(filter, pageable);

    if (result.isFailure) {
      throw new ResponseException(result.errors[0], result.status);
    }

    return result.value.map(ApiKeyMapper.toDto);
  }

  @Get('count/application-id/:applicationId')
  async countByApplicationIdHttp(
    @UUIDParam('applicationId') applicationId: string,
    @CurrentUser() payload: Payload,
  ): Promise<number> {
    const result: Result<number> = await this.countByApplicationId.execute(
      applicationId,
      payload.sub,
    );

    if (result.isFailure) {
      throw new ResponseException(result.errors[0], result.status);
    }

    return result.value;
  }

  @Delete('/:id')
  async delete(@CurrentUser() payload: Payload, @UUIDParam('id') id: string): Promise<void> {
    const result = await this.deleteById.execute(id, payload.sub);

    if (result.isFailure) {
      throw new ResponseException(result.errors[0], result.status);
    }
  }

  @Post()
  async create(@CurrentUser() payload: Payload, @Body() dto: CreateApiKeyDto) {
    const result: Result<CreateApiKeyResponse> = await this.createApiKey.execute(dto, payload.sub);

    if (result.isFailure) {
      throw new ResponseException(result.errors[0], result.status);
    }

    return {
      apiKey: ApiKeyMapper.toDto(result.value.apiKey),
      key: result.value.rawKey,
    };
  }

  @Get('exists/name/:name')
  async existsByNameHttp(@Param('name') name: string): Promise<boolean> {
    const result = await this.existsByName.execute(name);

    if (result.isFailure) {
      throw new ResponseException(result.errors[0], result.status);
    }

    return result.value;
  }

  @Get('exists/name/application-id/:name/:appId')
  async existsByNameAndAppIdHttp(@Param('name') name: string, @Param('appId') appId: string) {
    const result = await this.existsByNameAndAppId.execute(appId, name);

    if (result.isFailure) {
      throw new ResponseException(result.errors[0], result.status);
    }

    return result.value;
  }

  @Get('exists/:id')
  async existsByIdHttp(@UUIDParam('id') id: string) {
    const result: Result<boolean> = await this.existsById.execute(id);

    if (result.isFailure) {
      throw new ResponseException(result.errors[0], result.status);
    }

    return result.value;
  }

  @Get('/:id')
  async getById(@CurrentUser() payload: Payload, @UUIDParam('id') id: string) {
    const result: Result<ApiKeyEntity> = await this.findById.execute(id, payload.sub);

    if (result.isFailure) {
      throw new ResponseException(result.errors[0], result.status);
    }

    return ApiKeyMapper.toDto(result.value);
  }
}
