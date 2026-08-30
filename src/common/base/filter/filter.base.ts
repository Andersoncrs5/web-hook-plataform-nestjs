import { Type } from 'class-transformer';
import { IsDate, IsInt, IsOptional, IsUUID } from 'class-validator';

export class BaseFilter {
    @IsOptional()
    @IsUUID('4')
    id?: string;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    version?: number;

    @IsOptional()
    @Type(() => Date)
    @IsDate()
    createdAtMin?: Date;

    @IsOptional()
    @Type(() => Date)
    @IsDate()
    createdAtMax?: Date;

    @IsOptional()
    @Type(() => Date)
    @IsDate()
    updatedAtMin?: Date;

    @IsOptional()
    @Type(() => Date)
    @IsDate()
    updatedAtMax?: Date;
}