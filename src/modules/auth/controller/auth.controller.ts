import { Controller, Get, Post, Body, Param, HttpStatus, HttpCode } from '@nestjs/common';
import { RegisterUserService } from '../services/register-user/register-user.use-case.service';
import { CreateUserDto } from 'src/modules/user/dto/create-user.dto';
import { ResponseException } from 'src/utils/exceptions/classes/response.exception';
import { LoginUserUseCase } from '../services/login-user/login-user.use-case.service';
import { LoginUserDto } from '../dto/request/login-user.requests';
import { Idempotent } from 'src/infra/transactional-messaging/inbox/annotation/idempotent.decorator';
import { Tokens } from '../classes/token.class';
import { Result } from 'src/common/result/result';
import { RotateRefreshTokenUseCase } from '../services/rotate-refresh-token/rotate-refresh-token.use-case.service';

@Controller('v1/auth')
export class AuthController {
  constructor(
    private readonly registerService: RegisterUserService,
    private readonly loginUserService: LoginUserUseCase,
    private readonly rotateRefreshTokne: RotateRefreshTokenUseCase
  ) {}

  @Post('/register')
  // @Idempotent()
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: CreateUserDto) {
    const result: Result<Tokens> = await this.registerService.execute(dto);

    if (result.isFailure) throw new ResponseException(result.errors[0], result.status)
    
    return result.value
  }

  @Post('/login')
  // @Idempotent()
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginUserDto) {
    const result = await this.loginUserService.execute(dto);

    if (result.isFailure) throw new ResponseException(result.errors[0], result.status)

    return result.value
  }

  @Get("/rotate/:token")
  @HttpCode(HttpStatus.OK)
  async rotateRefreshToken(
      @Param("token") token: string,
  ) {
      const result = await this.rotateRefreshTokne.execute(token);

      if (result.isFailure) {
          throw new ResponseException(
              result.errors[0],
              result.status,
          );
      }

      return result.value;
  }


}
