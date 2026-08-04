import { Module } from '@nestjs/common';
import { UserController } from './controller/user.controller';
import { IUserRepository } from './repository/iuser.repository';
import { UserRepository } from './repository/user.repository';
import { CreateUserUseCase } from './services/create-user/create-user.use-case.service';
import { DeleteByIdUserUseCase } from './services/delete-user/delete-user-by-id.use-case.service';
import { FindUserByEmailUseCase } from './services/find-email/find-user-email.use-case.service';
import { FindUserByIdUserUseCase } from './services/find-by-id/find-by-id-user.use-case.service';

@Module({
  controllers: [UserController],
  providers: [
    CreateUserUseCase,
    DeleteByIdUserUseCase,
    FindUserByEmailUseCase,
    FindUserByIdUserUseCase,
    {
      provide: IUserRepository,
      useClass: UserRepository,
    },
  ],
  exports: [IUserRepository],
})
export class UserModule {}


