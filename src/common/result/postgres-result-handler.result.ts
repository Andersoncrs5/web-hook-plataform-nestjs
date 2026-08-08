import { InternalServerErrorException } from "@nestjs/common";
import { PostgresError } from "postgres";

import { Result } from "src/common/result/result";

export class PostgresResultHandler {

    static handle<T>(error: PostgresError): Result<T> {

        switch (error.code) {

            case "23505":
                return Result.failure(
                    [error.constraint_name ?? "unique_constraint"],
                    409,
                );

            case "23502":
                return Result.failure(
                    [error.column_name ?? "unknown_column"],
                    400,
                );

            case "23503":
                return Result.failure(
                    [error.constraint_name ?? "foreign_key"],
                    409,
                );

            case "23514":
                return Result.failure(
                    [error.constraint_name ?? "check_constraint"],
                    400,
                );

            case "40001":
                return Result.failure(
                    ["Transaction conflict, please retry"],
                    409,
                );

            case "40P01":
                return Result.failure(
                    ["Deadlock detected, please retry"],
                    409,
                );

            case "42501":
                return Result.failure(
                    ["Insufficient database privileges"],
                    403,
                );

            case "22P02":
                return Result.failure(
                    ["Invalid data format"],
                    400,
                );

            case "22001":
                return Result.failure(
                    ["Value too long"],
                    400,
                );

            case "22003":
                return Result.failure(
                    ["Numeric value out of range"],
                    400,
                );

            default:
                throw new InternalServerErrorException(error);
        }
    }
}