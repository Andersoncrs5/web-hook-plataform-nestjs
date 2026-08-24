import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateUserDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsOptional()
    @IsString()
    fullName?: string;

    @IsString()
    @IsOptional()
    password?: string;
}