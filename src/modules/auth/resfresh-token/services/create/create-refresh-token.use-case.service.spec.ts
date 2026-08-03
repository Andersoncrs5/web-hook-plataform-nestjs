import { Test, TestingModule } from "@nestjs/testing";
import { ConfigService } from "@nestjs/config";
import { InternalServerErrorException } from "@nestjs/common";
import * as argon2 from "argon2";

import { CreateRefreshTokenService } from "./create-refresh-token.use-case.service";
import { RefreshTokenRepository } from "../../repository/refresh-token.repository";
import { RefreshToken } from "../../entities/refresh-token.entity";

// Mock do argon2 para testes unitários rápidos e seguros
jest.mock("argon2", () => ({
    hash: jest.fn().mockResolvedValue("$argon2id$v=19$m=65536,t=3,p=4$mocked_hash"),
}));

describe("CreateRefreshTokenService ( UnitTest )", () => {

    let service: CreateRefreshTokenService;
    let repository: jest.Mocked<RefreshTokenRepository>;
    let configService: jest.Mocked<ConfigService>;

    const mockRepository = {
        create: jest.fn(),
    };

    const mockConfigService = {
        getOrThrow: jest.fn(),
    };

    const fakeUserId = "user-uuid-1234-5678";

    beforeEach(async () => {

        const module: TestingModule =
            await Test.createTestingModule({
                providers: [
                    CreateRefreshTokenService,
                    {
                        provide: RefreshTokenRepository,
                        useValue: mockRepository,
                    },
                    {
                        provide: ConfigService,
                        useValue: mockConfigService,
                    },
                ],
            }).compile();

        service = module.get<CreateRefreshTokenService>(
            CreateRefreshTokenService,
        );

        repository = module.get(RefreshTokenRepository);
        configService = module.get(ConfigService);
    });

    beforeEach(() => {
        jest.clearAllMocks();
        configService.getOrThrow.mockReturnValue(24);
    });

    it("should be defined and dependencies correctly mocked", () => {
        expect(service).toBeDefined();
        expect(repository).toBeDefined();
        expect(configService).toBeDefined();
    });

    describe("execute", () => {

        it("should successfully create a refresh token (Happy Path)", async () => {

            repository.create.mockImplementation(
                async (token: RefreshToken) => token,
            );

            const before = Date.now();
            const result = await service.execute(fakeUserId);
            const after = Date.now();

            expect(result).toBeDefined();
            expect(result.isSuccess).toBe(true);

            expect(repository.create).toHaveBeenCalledTimes(1);

            const createdToken = repository.create.mock.calls[0][0];

            expect(createdToken).toBeInstanceOf(RefreshToken);
            expect(createdToken.userId).toBe(fakeUserId);
            expect(createdToken.tokenHash).toBeDefined();
            expect(createdToken.tokenHash.length).toBeGreaterThan(0);

            const minExpiration = before + (24 * 60 * 60 * 1000);
            const maxExpiration = after + (24 * 60 * 60 * 1000);

            expect(createdToken.expiresAt.getTime())
                .toBeGreaterThanOrEqual(minExpiration - 1000);

            expect(createdToken.expiresAt.getTime())
                .toBeLessThanOrEqual(maxExpiration + 1000);

            expect(configService.getOrThrow).toHaveBeenCalledTimes(1);
            expect(configService.getOrThrow).toHaveBeenCalledWith(
                "REFRESH_TOKEN_EXP_HOUR",
            );
        });

        it("should create the refresh token for the provided user", async () => {
            repository.create.mockImplementation(
                async (token: RefreshToken) => token,
            );

            await service.execute(fakeUserId);

            expect(repository.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    userId: fakeUserId,
                }),
            );
        });

        it("should generate an Argon2 hash", async () => {
            repository.create.mockImplementation(
                async (token: RefreshToken) => token,
            );

            await service.execute(fakeUserId);

            const createdToken = repository.create.mock.calls[0][0];

            expect(createdToken.tokenHash).toMatch(/^\$argon2/);
        });

        it("should use the configured expiration time", async () => {
            const expirationHours = 72;

            configService.getOrThrow.mockReturnValue(expirationHours);
            repository.create.mockImplementation(
                async (token: RefreshToken) => token,
            );

            const before = Date.now();
            await service.execute(fakeUserId);
            const after = Date.now();

            const createdToken = repository.create.mock.calls[0][0];

            const expectedMin = before + (expirationHours * 60 * 60 * 1000);
            const expectedMax = after + (expirationHours * 60 * 60 * 1000);

            expect(createdToken.expiresAt.getTime())
                .toBeGreaterThanOrEqual(expectedMin - 1000);

            expect(createdToken.expiresAt.getTime())
                .toBeLessThanOrEqual(expectedMax + 1000);
        });

        describe("Database Constraint Violations (Sad Paths)", () => {

            it("should return conflict when token hash already exists (23505)", async () => {
                const dbError = {
                    code: "23505",
                    detail: "Key (token_hash)=() already exists. uk_refresh_tokens_token_hash",
                };

                repository.create.mockRejectedValue(dbError);

                const result = await service.execute(fakeUserId);

                expect(result.isSuccess).toBe(false);
                expect(result.errors[0]).toBe("Token hash already exists.");
                expect(repository.create).toHaveBeenCalledTimes(1);
            });

            it("should return generic conflict for unknown unique constraint (23505)", async () => {
                const dbError = {
                    code: "23505",
                    detail: "Some other unique constraint violation",
                };

                repository.create.mockRejectedValue(dbError);

                const result = await service.execute(fakeUserId);

                expect(result.isSuccess).toBe(false);
                expect(result.errors[0]).toBe("Data conflict detected.");
            });

            it("should return bad request when a field is null (23502)", async () => {
                const dbError = {
                    code: "23502",
                    column: "user_id",
                };

                repository.create.mockRejectedValue(dbError);

                const result = await service.execute(fakeUserId);

                expect(result.isSuccess).toBe(false);
                expect(result.errors[0]).toBe('The field "user_id" cannot be null.');
            });

            it("should handle missing column property on null violation (23502)", async () => {
                const dbError = {
                    code: "23502",
                };

                repository.create.mockRejectedValue(dbError);

                const result = await service.execute(fakeUserId);

                expect(result.isSuccess).toBe(false);
                expect(result.errors[0]).toBe('The field "unknown field" cannot be null.');
            });

            it("should return bad request when field exceeds maximum length (22001)", async () => {
                const dbError = {
                    code: "22001",
                };

                repository.create.mockRejectedValue(dbError);

                const result = await service.execute(fakeUserId);

                expect(result.isSuccess).toBe(false);
                expect(result.errors[0]).toBe(
                    "One or more fields exceed the maximum allowed length (e.g., 100 characters for name or 255 for email).",
                );
            });

            it("should return bad request when referenced user does not exist (23503)", async () => {
                const dbError = {
                    code: "23503",
                };

                repository.create.mockRejectedValue(dbError);

                const result = await service.execute(fakeUserId);

                expect(result.isSuccess).toBe(false);
                expect(result.errors[0]).toBe("The referenced user does not exist.");
            });

            it("should return bad request when data violates check constraint (23514)", async () => {
                const dbError = {
                    code: "23514",
                };

                repository.create.mockRejectedValue(dbError);

                const result = await service.execute(fakeUserId);

                expect(result.isSuccess).toBe(false);
                expect(result.errors[0]).toBe("Refresh token data violates a database constraint.");
            });

            it("should return bad request when data format is invalid (22P02)", async () => {
                const dbError = {
                    code: "22P02",
                };

                repository.create.mockRejectedValue(dbError);

                const result = await service.execute(fakeUserId);

                expect(result.isSuccess).toBe(false);
                expect(result.errors[0]).toBe("Invalid refresh token data.");
            });

            it("should throw InternalServerErrorException for unhandled database errors", async () => {
                const unknownError = new Error("Random database failure");

                repository.create.mockRejectedValue(unknownError);

                await expect(service.execute(fakeUserId)).rejects.toThrow(
                    InternalServerErrorException,
                );

                await expect(service.execute(fakeUserId)).rejects.toThrow(
                    "Error creating user.",
                );

                expect(repository.create).toHaveBeenCalledTimes(2);
            });

        });

        describe("Configuration Errors", () => {

            it("should throw InternalServerErrorException when configuration fails", async () => {
                configService.getOrThrow.mockImplementation(() => {
                    throw new Error("REFRESH_TOKEN_EXP_HOUR is not configured");
                });

                await expect(service.execute(fakeUserId)).rejects.toThrow(
                    InternalServerErrorException,
                );

                expect(repository.create).not.toHaveBeenCalled();
            });

        });

    });

});