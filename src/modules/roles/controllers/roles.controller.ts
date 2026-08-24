import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { CreateRoleDto } from '../dto/create-role.dto';
import { UpdateRoleDto } from '../dto/update-role.dto';
import { FindByIdRoleUseCase } from '../services/find-id-role/find-by-id-role.use-case.service';
import { ResponseException } from 'src/utils/exceptions/classes/response.exception';
import { JwtGuard } from 'src/common/guards/guards/auth-guards.guard';

@Controller('v1/roles')
export class RolesController {
  constructor(
    private readonly roleById: FindByIdRoleUseCase
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

}
