import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { CreateRoleDto } from '../dto/create-role.dto';
import { UpdateRoleDto } from '../dto/update-role.dto';
import { FindByIdRoleUseCase } from '../services/find-id-role/find-by-id-role.use-case.service';
import { ResponseException } from 'src/utils/exceptions/classes/response.exception';
import { JwtGuard } from 'src/common/guards/guards/auth-guards.guard';
import { RolesGuard } from 'src/common/guards/guards/role.guard';
import { Roles } from 'src/modules/auth/decorators/roles.decorator';
import { CreateRoleUseCase } from '../services/create-role/create-role.use-case.service';
import { UpdateRoleUseCase } from '../services/update-role/update-role.use-case.service';
import { DeleteRoleByIdUseCase } from '../services/delete-role/delete-role-by-id.use-case.service';
import { FindAllRoleUseCase } from '../services/find-all/find-all-role.use-case.service';
import { RoleFilter } from '../dto/role-filter.dto';
import { Pageable } from 'src/common/page/page';
import { RoleSort } from '../dto/role-sort.dto';
import { CheckRoleExistsByNameUseCase } from '../services/exists-name/check-role-exists-by-name.use-case.service';

@Controller('v1/roles')
@UseGuards(JwtGuard, RolesGuard)
export class RolesController {
  constructor(
    private readonly roleById: FindByIdRoleUseCase,
    private readonly createRole: CreateRoleUseCase,
    private readonly updateRole: UpdateRoleUseCase,
    private readonly deleteRole: DeleteRoleByIdUseCase,
    private readonly findAllRole: FindAllRoleUseCase,
    private readonly checkRoleExistsByNameUseCase: CheckRoleExistsByNameUseCase
  ) {}

  @Get("/:id")
  @UseGuards(JwtGuard)
  async findById(
    @Param("id") id: string,
  ) {
    const result = await this.roleById.execute(id);

    if (result.isFailure) {
        throw new ResponseException(
            result.errors[0],
            result.status,
        );
    }

    return result.value;
  } 

  @Post()
  @Roles('ADMIN', 'MASTER')
  @UseGuards(JwtGuard)
  async create(
    @Body() dto: CreateRoleDto
  ) {
    const result = await this.createRole.execute(dto)

    if (result.isFailure) {
        throw new ResponseException(
            result.errors[0],
            result.status,
        );
    }

    return result.value;
  }

  @Patch("/:id")
  @Roles('ADMIN', 'MASTER')
  async update(
    @Param("id") id: string,
    @Body() dto: UpdateRoleDto
  ) {
    const result = await this.updateRole.execute(id, dto);

    if (result.isFailure) {
        throw new ResponseException(
            result.errors[0],
            result.status,
        );
    }

    return result.value;
  }

  @Delete("/:id")
  @Roles('ADMIN', 'MASTER')
  async delete(
    @Param("id") id: string
  ) {
    const result = await this.deleteRole.execute(id);

    if (result.isFailure) {
        throw new ResponseException(
            result.errors[0],
            result.status,
        );
    }

    return result.value;
  }

  @Get()
  @UseGuards(JwtGuard)
  async findAll(
    @Query() filter: RoleFilter,
    @Query() pageable: Pageable<RoleSort>,
  ) {
    const result = await this.findAllRole.execute(filter, pageable);

    if (result.isFailure) {
        throw new ResponseException(
            result.errors[0],
            result.status,
        );
    }

    return result.value;
  }

  @Get("/exists/name/:name")
  @UseGuards(JwtGuard)
  async checkExistsByName(
    @Param("name") name: string
  ) {
    const result = await this.checkRoleExistsByNameUseCase.execute(name);

    if (result.isFailure) {
        throw new ResponseException(
            result.errors[0],
            result.status,
        );
    }

    return result.value;
  }

}
