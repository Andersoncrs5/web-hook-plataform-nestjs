import { Module } from '@nestjs/common';
import { UserRoleController } from './controller/user-role.controller';
import { CreateUserRoleService } from './services/create/create-user-role.use-case.service';
import { DeleteUserRoleByIdUseCase } from './services/delete-by-id/delete-user-role-by-id.use-case.service';
import { ExistsByRoleIdAndUserIdUseCase } from './services/exists-by-role-id-user-id/exists-by-role-id-user-id.use-case.service';
import { FindAllUserRoleUseCase } from './services/find-all/find-all-user-role.use-case.service';

@Module({
  controllers: [UserRoleController],
  providers: [
    CreateUserRoleService,
    DeleteUserRoleByIdUseCase,
    ExistsByRoleIdAndUserIdUseCase,
    FindAllUserRoleUseCase
  ],
  exports: [
    CreateUserRoleService,
    DeleteUserRoleByIdUseCase,
    ExistsByRoleIdAndUserIdUseCase,
    FindAllUserRoleUseCase
  ],
})
export class UserRoleModule {}
