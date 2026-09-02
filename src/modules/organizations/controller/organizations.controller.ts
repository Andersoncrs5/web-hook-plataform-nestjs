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
import { CreateOrganizationDto } from '../dto/request/create-organization.dto';
import { CreateOrganizationUseCase } from '../services/create/create-organization.use-case.service';
import { Payload } from 'src/modules/auth/classes/payload.class';
import { CurrentUser } from 'src/modules/auth/decorators/current-user.decorator';
import { ResponseException } from 'src/utils/exceptions/classes/response.exception';
import { OrganizationMapper } from '../mapper/organization.mapper';
import { OrganizationDTO } from '../dto/response/organization.dto';
import { FindOrganizationByIdUseCase } from '../services/find-by-id/find-organization-by-id.use-case.service';
import { isUUID } from 'class-validator';
import { DeleteOrganizationByIdUseCase } from '../services/delete-by-id/delete-organization-by-id.use-case.service';
import { UpdateOrganizationUseCase } from '../services/update/update-organization.use-case.service';
import { UpdateOrganizationDto } from '../dto/request/update-organization.dto';
import { FindAllOrganizationUseCase } from '../services/find-all/find-all-organization.use-case.service';
import { OrganizationFilter } from '../dto/page/organization-filter.dto';
import { OrganizationSort } from '../dto/page/organization-sort.dto';
import { Pageable } from 'src/common/page/page';
import { ExistsOrganizationByNameUseCase } from '../services/exists-by-name/exists-organization-by-name.use-case.service';
import { ExistsOrganizationBySlugUseCase } from '../services/exists-slug/exists-organization-by-slug.use-case.service';
import { JwtGuard } from 'src/common/guards/guards/auth/auth-guards.guard';

@UseGuards(JwtGuard)
@Controller('v1/organizations')
export class OrganizationsController {
  constructor(
    private readonly createOrg: CreateOrganizationUseCase,
    private readonly findOrgById: FindOrganizationByIdUseCase,
    private readonly deleteById: DeleteOrganizationByIdUseCase,
    private readonly updateOrg: UpdateOrganizationUseCase,
    private readonly findAllOrgs: FindAllOrganizationUseCase,
    private readonly existsOrgByName: ExistsOrganizationByNameUseCase,
    private readonly existsOrgBySlug: ExistsOrganizationBySlugUseCase,
  ) {}

  @Post()
  async create(
    @CurrentUser() payload: Payload,
    @Body() dto: CreateOrganizationDto,
  ): Promise<OrganizationDTO> {
    const result = await this.createOrg.execute(dto, payload.sub);

    if (result.isFailure) {
      throw new ResponseException(result.errors[0], result.status);
    }

    return OrganizationMapper.toDto(result.value);
  }

  @Get('/:id')
  async findById(@Param('id') id: string): Promise<OrganizationDTO> {
    const result = await this.findOrgById.execute(id);

    if (result.isFailure) {
      throw new ResponseException(result.errors[0], result.status);
    }

    return OrganizationMapper.toDto(result.value);
  }

  @Delete('/:id')
  async delete(@CurrentUser() payload: Payload, @Param('id') id: string): Promise<void> {
    const result = await this.deleteById.execute(id, payload.sub);

    if (result.isFailure) {
      throw new ResponseException(result.errors[0], result.status);
    }
  }

  @Patch('/:id')
  async update(
    @Param('id') id: string,
    @CurrentUser() payload: Payload,
    @Body() dto: UpdateOrganizationDto,
  ) {
    const result = await this.updateOrg.execute(id, dto, payload.sub);

    if (result.isFailure) {
      throw new ResponseException(result.errors[0], result.status);
    }

    return OrganizationMapper.toDto(result.value);
  }

  @Get()
  async findAll(@Query() filter: OrganizationFilter, @Query() pageble: Pageable<OrganizationSort>) {
    return await this.findAllOrgs.execute(filter, pageble);
  }

  @Get('/exists/name/:name')
  async existsByName(@Param('name') name: string): Promise<boolean> {
    const result = await this.existsOrgByName.execute(name);

    if (result.isFailure) {
      throw new ResponseException(result.errors[0], result.status);
    }

    return result.value;
  }

  @Get('/exists/slug/:slug')
  async existsBySlug(@Param('slug') slug: string): Promise<boolean> {
    const result = await this.existsOrgBySlug.execute(slug);

    if (result.isFailure) {
      throw new ResponseException(result.errors[0], result.status);
    }

    return result.value;
  }
}
