import { Module } from '@nestjs/common';
import { UserController } from './controller/user.controller';
import { IUserRepository } from './repository/iuser.repository';
import { UserRepository } from './repository/user.repository';
import { CreateUserUseCase } from './services/create-user/create-user.use-case.service';
import { DeleteByIdUserUseCase } from './services/delete-user/delete-user-by-id.use-case.service';
import { FindUserByEmailUseCase } from './services/find-email/find-user-email.use-case.service';
import { FindUserByIdUserUseCase } from './services/find-by-id/find-by-id-user.use-case.service';
import { UpdateUserUseCase } from './services/update-user/update-user.use-case.service';
import { FindAllUserUseCase } from './services/find-all/find-all.use-case.service';
import { ExistsUserByEmailUseCase } from './services/exists-email/exists-by-email.service';
import { ExistsUserByNameUseCase } from './services/exists-name/exists-user-by-name.service';

@Module({
  controllers: [UserController],
  providers: [
    UserRepository,
    CreateUserUseCase,
    DeleteByIdUserUseCase,
    FindAllUserUseCase,
    FindUserByEmailUseCase,
    UpdateUserUseCase,
    FindUserByIdUserUseCase,
    ExistsUserByEmailUseCase,
    ExistsUserByNameUseCase,
    {
      provide: IUserRepository,
      useClass: UserRepository,
    },
  ],
  exports: [
    UserRepository,
    IUserRepository,
    CreateUserUseCase,
    DeleteByIdUserUseCase,
    FindAllUserUseCase,
    FindUserByEmailUseCase,
    UpdateUserUseCase,
    FindUserByIdUserUseCase,
    ExistsUserByEmailUseCase,
    ExistsUserByNameUseCase
  ],
})
export class UserModule {}


