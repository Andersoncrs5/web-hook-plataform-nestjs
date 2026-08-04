import { Controller, Get, Post, Body, Patch, Param, Delete, HttpStatus, HttpCode } from '@nestjs/common';
import { RegisterUserService } from '../services/register-user/register-user.use-case.service';
import { CreateUserDto } from 'src/modules/user/dto/create-user.dto';
import { ResponseException } from 'src/utils/exceptions/classes/response.exception';
import { LoginUserUseCase } from '../services/login-user/login-user.use-case.service';
import { LoginUserDto } from '../dto/request/login-user.requests';

@Controller('v1/auth')
export class AuthController {
  constructor(
    private readonly registerService: RegisterUserService,
    private readonly loginUserService: LoginUserUseCase
  ) {}

  @Post('/register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: CreateUserDto) {
    const result = await this.registerService.execute(dto);

    if (result.isFailure) {
      throw new ResponseException(result.errors[0], result.status)
    }

    return result.value
  }

  @Post('/login')
  @HttpCode(HttpStatus.CREATED)
  async login(@Body() dto: LoginUserDto) {
    const result = await this.loginUserService.execute(dto);

    if (result.isFailure) {
      throw new ResponseException(result.errors[0], result.status)
    }

    return result.value
  }




}
