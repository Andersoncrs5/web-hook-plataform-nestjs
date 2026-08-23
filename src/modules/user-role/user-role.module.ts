import { Module } from '@nestjs/common';
import { UserRoleController } from './controller/user-role.controller';

import { CreateUserRoleService } from './services/create/create-user-role.use-case.service';
import { DeleteUserRoleByIdUseCase } from './services/delete-by-id/delete-user-role-by-id.use-case.service';
import { ExistsByRoleIdAndUserIdUseCase } from './services/exists-by-role-id-user-id/exists-by-role-id-user-id.use-case.service';
import { FindAllUserRoleUseCase } from './services/find-all/find-all-user-role.use-case.service';

import { UserRoleRepository } from './repository/user-role.repository';
import { IUserRoleRepository } from './repository/iuser-role.repository';

import { FindUserRoleByUserIdJustRoleIdUseCase } from './services/find-by-user-id/find-by-user-id.use-case.service';
import { FindAllRoleNamesByUserIdUseCase } from './services/find-all-roles-name-by-user-id/find-all-role-names-by-user-id.service';
import { FindAllRolesByUserIdUseCase } from './services/find-all-roles-by-user-id/find-all-roles-by-user-id.service';

@Module({
  controllers: [
    UserRoleController,
  ],

  providers: [
    UserRoleRepository,

    CreateUserRoleService,
    DeleteUserRoleByIdUseCase,
    ExistsByRoleIdAndUserIdUseCase,
    FindAllUserRoleUseCase,
    FindUserRoleByUserIdJustRoleIdUseCase,
    FindAllRoleNamesByUserIdUseCase,
    FindAllRolesByUserIdUseCase,

    {
      provide: IUserRoleRepository,
      useExisting: UserRoleRepository,
    },
  ],

  exports: [
    UserRoleRepository,

    IUserRoleRepository,

    CreateUserRoleService,
    DeleteUserRoleByIdUseCase,
    ExistsByRoleIdAndUserIdUseCase,
    FindUserRoleByUserIdJustRoleIdUseCase,
    FindAllUserRoleUseCase,
    FindAllRoleNamesByUserIdUseCase,
    FindAllRolesByUserIdUseCase,
  ],
})
export class UserRoleModule {}
