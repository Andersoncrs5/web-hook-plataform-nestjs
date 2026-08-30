import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { CreateUserRoleDto } from '../dto/create-user-role.dto';
import { UpdateUserRoleDto } from '../dto/update-user-role.dto';
import { ExistsByRoleIdAndUserIdUseCase } from '../services/exists-by-role-id-user-id/exists-by-role-id-user-id.use-case.service';
import { ResponseException } from 'src/utils/exceptions/classes/response.exception';
import { JwtGuard } from 'src/common/guards/guards/auth-guards.guard';
import { RolesGuard } from 'src/common/guards/guards/role.guard';

@Controller('v1/user-role')
@UseGuards(JwtGuard, RolesGuard)
export class UserRoleController {
  constructor(
    private readonly existsUserIdAndRoleId: ExistsByRoleIdAndUserIdUseCase
  ) {}

  @Get("/exists/:userId/:roleId")
  @UseGuards(JwtGuard)
  async exists(
    @Param("userId") userId: string,
    @Param("roleId") roleId: string,
  ) {
    const result = await this.existsUserIdAndRoleId.execute(roleId, userId);

    if (result.isFailure) {
        throw new ResponseException(
            result.errors[0],
            result.status,
        );
    }

    return result.value;
  }

}
