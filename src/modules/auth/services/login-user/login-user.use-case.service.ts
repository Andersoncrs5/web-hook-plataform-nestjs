import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { LoginUserDto } from '../../dto/request/login-user.requests';
import { FindUserByEmailUseCase } from 'src/modules/user/services/find-email/find-user-email.use-case.service';
import { Result } from 'src/common/result/result';
import { User } from 'src/modules/user/entities/user.entity';
import { PasswordService } from 'src/common/crypto/password.service';
import { CreateTokensUseCase } from '../create-token/create-token.use-case.service';
import { FindUserRoleByUserIdJustRoleIdUseCase } from 'src/modules/user-role/services/find-by-user-id/find-by-user-id.use-case.service';
import { FindRoleByIds } from 'src/modules/roles/services/find-role-by-ids/find-role-by-ids.use-case.service';
import { Role } from 'src/modules/roles/entities/role.entity';
import { isEmail } from 'class-validator';

@Injectable()
export class LoginUserUseCase {
  constructor(
    private readonly findUserByEmail: FindUserByEmailUseCase,
    private readonly passwordService: PasswordService,
    private readonly createTokens: CreateTokensUseCase,
    private readonly findUserRoleByUserIdJustRoleId: FindUserRoleByUserIdJustRoleIdUseCase,
    private readonly findRolesById: FindRoleByIds,
  ) {}

  async execute(dto: LoginUserDto) {
    try {
      if (!isEmail(dto.email)) return Result.badRequest('Email invalid');

      const userResult: Result<User> = await this.findUserByEmail.execute(dto.email);

      if (userResult.isFailure) return Result.unauthorized('Login invalid');

      const user: User = userResult.value;

      const passwordValid = await this.passwordService.verify(user.passwordHash, dto.password);

      if (!passwordValid) return Result.unauthorized('Login invalid');

      const roleIdsResult = await this.findUserRoleByUserIdJustRoleId.execute(user.id);

      if (roleIdsResult.isFailure) {
        return Result.failure(roleIdsResult.errors, roleIdsResult.status);
      }

      const roleIds = roleIdsResult.value;

      let roleNames: string[] = [];

      if (roleIds.length > 0) {
        const rolesResult: Result<Role[]> = await this.findRolesById.execute(roleIds);

        if (rolesResult.isFailure) {
          return Result.failure(rolesResult.errors, rolesResult.status);
        }

        roleNames = rolesResult.value.map((role) => role.name);
      }

      const tokensResult = await this.createTokens.execute(user, roleNames);

      if (tokensResult.isFailure) {
        return Result.failure(tokensResult.errors, tokensResult.status);
      }

      return Result.ok(tokensResult.value);
    } catch (error) {
      throw new InternalServerErrorException('An unexpected error occurred during login.');
    }
  }
}
