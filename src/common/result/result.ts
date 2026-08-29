import { HttpStatus } from '@nestjs/common';

export class Result<T> {
    private constructor(
        private readonly _value: T | null,
        private readonly _isSuccess: boolean,
        private readonly _errors: string[],
        private readonly _status: HttpStatus,
    ) {}

    // =========================
    // FACTORY METHODS
    // =========================

    static success<T>(value: T, status: HttpStatus = HttpStatus.OK): Result<T> {
        return new Result(value as T, true, [], status);
    }
    
    static ok<T>(value?: T): Result<T> {
        return new Result(value ?? (null as unknown as T), true, [], HttpStatus.OK);
    }

    static created<T>(value: T): Result<T> {
        return new Result(value, true, [], HttpStatus.CREATED);
    }

    static badRequest<T>(...errors: string[]): Result<T> {
        return new Result<T>(null as T, false, errors, HttpStatus.BAD_REQUEST);
    }

    static notFound<T>(...errors: string[]): Result<T> {
        return new Result<any>(null as T, false, errors, HttpStatus.NOT_FOUND);
    }

    static conflict<T>(...errors: string[]): Result<T> {
        return new Result<any>(null as T, false, errors, HttpStatus.CONFLICT);
    }

    static forb<T>(...errors: string[]): Result<T> {
        return new Result<any>(null as T, false, errors, HttpStatus.FORBIDDEN);
    }

    static failure<T>(errors: string[], status: HttpStatus): Result<T> {
        return new Result<any>(null as T, false, errors, status);
    }

    static internalServer<T>(errors: string): Result<T> {
        return new Result<any>(null as T, false, [errors], HttpStatus.INTERNAL_SERVER_ERROR);
    }


    static unauthorized<T>(errors: string): Result<T> {
        return new Result<any>(null as T, false, [errors], HttpStatus.UNAUTHORIZED);
    }


    // =========================
    // GETTERS
    // =========================

    get value(): T {
        if (!this._isSuccess) {
            return null as T;
        }
        return this._value as T;
    }

    get errors(): string[] {
        return this._errors;
    }

    get status(): HttpStatus {
        return this._status;
    }

    get isSuccess(): boolean {
        return this._isSuccess;
    }

    get isFailure(): boolean {
        return !this._isSuccess;
    }

    get statusCode(): number {
        return this._status;
    }

    // =========================
    // TRANSFORMS
    // =========================

    map<U>(fn: (value: T) => U): Result<U> {
        if (this.isFailure) {
            return Result.failure(this._errors, this._status) as Result<U>;
        }

        const newValue = fn(this._value as T);

        return Result.success(newValue, this._status);
    }

    // =========================
    // SIDE EFFECTS
    // =========================

    ifSuccess(fn: (value: T) => void): Result<T> {
        if (this.isSuccess) fn(this._value as T);
        return this;
    }

    ifFailure(fn: (errors: string[]) => void): Result<T> {
        if (this.isFailure) fn(this._errors);
        return this;
    }

    // =========================
    // FALLBACKS
    // =========================

    orElse(defaultValue: T): T {
        return this.isSuccess ? (this._value as T) : defaultValue;
    }

    orElseGet(fn: () => T): T {
        return this.isSuccess ? (this._value as T) : fn();
    }

    orElseResult(fn: () => Result<T>): Result<T> {
        return this.isSuccess ? this : fn();
    }

    unwrapOr<R>(fn: (result: Result<T>) => R): T | R {
        if (this.isFailure) {
            return fn(this);
        }
        return this._value as T;
    }
}