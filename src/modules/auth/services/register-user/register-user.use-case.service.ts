import { JwtService } from "@nestjs/jwt";
import { CreateUserRoleService } from "src/modules/user-role/services/create/create-user-role.use-case.service";
import { CreateUserDto } from "src/modules/user/dto/create-user.dto";
import { User } from "src/modules/user/entities/user.entity";
import { CreateUserUseCase } from "src/modules/user/services/create-user/create-user.use-case.service";
import { Payload } from "../../classes/payload.class";
import { ConfigService } from "@nestjs/config";
import { Tokens } from "../../classes/token.class";
import { LoginResponse } from "../../dto/response/login.response";
import { CreateTokensUseCase } from "../create-token/create-token.use-case.service";

export class RegisterUser {
    constructor(
      private readonly jwtService: JwtService,
      private readonly createUser: CreateUserUseCase,
      private readonly createTokens: CreateTokensUseCase,
  ) {}

  async execute(dto: CreateUserDto) {
    const user = await this.createUser.execute(dto)


  }

  

}