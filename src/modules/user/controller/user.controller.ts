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
import { CurrentUser } from 'src/modules/auth/decorators/current-user.decorator';
import { Payload } from 'src/modules/auth/classes/payload.class';
import { DeleteByIdUserUseCase } from '../services/delete-user/delete-user-by-id.use-case.service';
import { ResponseException } from 'src/utils/exceptions/classes/response.exception';
import { Result } from 'src/common/result/result';
import { FindAllUserUseCase } from '../services/find-all/find-all.use-case.service';
import { UserFilter } from '../dto/user-filter.filter';
import { Pageable } from 'src/common/page/page';
import { UserSort } from '../dto/user-sort.page';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UpdateUserUseCase } from '../services/update-user/update-user.use-case.service';
import { FindUserByIdUserUseCase } from '../services/find-by-id/find-by-id-user.use-case.service';
import { ExistsUserByEmailUseCase } from '../services/exists-email/exists-by-email.service';
import { ExistsUserByNameUseCase } from '../services/exists-name/exists-user-by-name.service';
import { JwtGuard } from 'src/common/guards/guards/auth/auth-guards.guard';

@Controller('v1/user')
export class UserController {
  constructor(
    private readonly deleteUser: DeleteByIdUserUseCase,
    private readonly findUser: FindAllUserUseCase,
    private readonly findUserById: FindUserByIdUserUseCase,
    private readonly updateUser: UpdateUserUseCase,
    private readonly existsByEmailUseCase: ExistsUserByEmailUseCase,
    private readonly existsUserByNameUseCase: ExistsUserByNameUseCase,
  ) {}

  @Patch()
  async update(@CurrentUser() payload: Payload, @Body() dto: UpdateUserDto) {
    const userResult = await this.findUserById.execute(payload.sub);

    if (userResult.isFailure) {
      throw new ResponseException(userResult.errors[0], userResult.status);
    }

    const result = await this.updateUser.execute(userResult.value, dto);

    if (result.isFailure) {
      throw new ResponseException(result.errors[0], result.status);
    }

    return result.value;
  }

  @Get()
  @UseGuards(JwtGuard)
  async findAll(@Query() filter: UserFilter, @Query() pageable: Pageable<UserSort>) {
    const result = await this.findUser.execute(filter, pageable);

    if (result.isFailure) {
      throw new ResponseException(result.errors[0], result.status);
    }

    return result.value;
  }

  @Delete()
  @UseGuards(JwtGuard)
  async delete(@CurrentUser() payload: Payload) {
    const result: Result<null> = await this.deleteUser.execute(payload.sub);

    if (result.isFailure) {
      throw new ResponseException(result.errors[0], result.status);
    }

    return result.value;
  }

  @Get('/exists/email/:email')
  async existsByEmail(@Param('email') email: string): Promise<boolean> {
    const result = await this.existsByEmailUseCase.execute(email);

    if (result.isFailure) {
      throw new ResponseException(result.errors[0], result.status);
    }

    return result.value;
  }

  @Get('/exists/name/:name')
  async existsByName(@Param('name') name: string): Promise<boolean> {
    const result = await this.existsUserByNameUseCase.execute(name);

    if (result.isFailure) {
      throw new ResponseException(result.errors[0], result.status);
    }

    return result.value;
  }
}
