import { IsNotEmpty, IsString, IsUUID } from "class-validator";

export class CreateUserRoleDto {
    
    @IsNotEmpty({ message: 'User ID cannot be empty' })
    @IsString({ message: 'User ID must be a string' })
    @IsUUID('all', { message: 'User ID must be a valid UUID' })
    userId: string;

    @IsNotEmpty({ message: 'Role ID cannot be empty' })
    @IsString({ message: 'Role ID must be a string' })
    @IsUUID('all', { message: 'Role ID must be a valid UUID' })
    roleId: string;
    
}