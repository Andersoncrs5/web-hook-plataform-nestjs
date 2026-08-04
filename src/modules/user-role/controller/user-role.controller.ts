import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CreateUserRoleDto } from '../dto/create-user-role.dto';
import { UpdateUserRoleDto } from '../dto/update-user-role.dto';

@Controller('user-role')
export class UserRoleController {
  constructor() {}

}
