import { Injectable } from "@nestjs/common";
import { CreateUserDto } from "src/modules/user/dto/create-user.dto";
import { User } from "src/modules/user/entities/user.entity";
import { CreateUserUseCase } from "src/modules/user/services/create-user/create-user.use-case.service";
import { Tokens } from "../../classes/token.class";
import { CreateTokensUseCase } from "../create-token/create-token.use-case.service";
import { Result } from "src/common/result/result";
import { FindUserRoleByUserIdJustRoleIdUseCase } from "src/modules/user-role/services/find-by-user-id/find-by-user-id.use-case.service";
import { FindRoleByIds } from "src/modules/roles/services/find-role-by-ids/find-role-by-ids.use-case.service";
import { Role } from "src/modules/roles/entities/role.entity";

@Injectable()
export class RegisterUserService {
    constructor(
        private readonly createUser: CreateUserUseCase,
        private readonly createTokens: CreateTokensUseCase,
        private readonly findUserRoleByUserIdJustRoleId: FindUserRoleByUserIdJustRoleIdUseCase,
        private readonly findRolesById: FindRoleByIds
    ) {}

    async execute(dto: CreateUserDto): Promise<Result<Tokens>> {
        const userResult: Result<User> = await this.createUser.execute(dto);
        if (userResult.isFailure) return Result.failure(userResult.errors, userResult.status);
        const user = userResult.value;

        const roleIdsResult = await this.findUserRoleByUserIdJustRoleId.execute(user.id);
        if (roleIdsResult.isFailure) return Result.failure(roleIdsResult.errors, roleIdsResult.status);
        const roleIds = roleIdsResult.value;

        let roleNames: string[] = [];

        if (roleIds.length > 0) {
            const rolesResult: Result<Role[]> = await this.findRolesById.execute(roleIds);
            if (rolesResult.isFailure) return Result.failure(rolesResult.errors, rolesResult.status);
            roleNames = rolesResult.value.map((role) => role.name);
        }

        const tokensResult = await this.createTokens.execute(user, roleNames);
        if (tokensResult.isFailure) return Result.failure(tokensResult.errors, tokensResult.status);

        return Result.ok(tokensResult.value);
    }
}