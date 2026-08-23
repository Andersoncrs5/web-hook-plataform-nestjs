import { Module } from '@nestjs/common';
import { RolesController } from './controllers/roles.controller';
import { CreateRoleUseCase } from './services/create-role/create-role.use-case.service';
import { DeleteRoleByIdUseCase } from './services/delete-role/delete-role-by-id.use-case.service';
import { CheckRoleExistsByNameUseCase } from './services/exists-name/check-role-exists-by-name.use-case.service';
import { FindAllRoleUseCase } from './services/find-all/find-all-role.use-case.service';
import { FindByIdRoleUseCase } from './services/find-id-role/find-by-id-role.use-case.service';
import { UpdateRoleUseCase } from './services/update-role/update-role.use-case.service';
import { FindRoleByIds } from './services/find-role-by-ids/find-role-by-ids.use-case.service';
import { IRoleRepository } from './repository/iroles.repository';
import { RoleRepository } from './repository/roles.repository';

@Module({
  controllers: [RolesController],
  providers: [
    RoleRepository,
    CreateRoleUseCase,
    DeleteRoleByIdUseCase,
    CheckRoleExistsByNameUseCase,
    FindAllRoleUseCase,
    FindByIdRoleUseCase,
    UpdateRoleUseCase,
    FindRoleByIds,
    {
      provide: IRoleRepository,
      useClass: RoleRepository,
    },
  ],
  exports: [
    RoleRepository,
    IRoleRepository,
    CreateRoleUseCase,
    DeleteRoleByIdUseCase,
    CheckRoleExistsByNameUseCase,
    FindAllRoleUseCase,
    FindByIdRoleUseCase,
    UpdateRoleUseCase,
    FindRoleByIds
  ],
})
export class RolesModule {}
