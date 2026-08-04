import { Test, TestingModule } from "@nestjs/testing";

import { RotateRefreshTokenUseCase } from "./rotate-refresh-token.use-case.service";
import { CreateTokensUseCase } from "../create-token/create-token.use-case.service";
import { FindRefreshTokenWithUserService } from "../../resfresh-token/services/find-token-by-hash-with-user/find-token-by-hash-with-user.service";
import { FindAllRoleNamesByUserIdUseCase } from "src/modules/user-role/services/find-all-roles-name-by-user-id/find-all-role-names-by-user-id.service";

import { RefreshTokenEntity } from "../../resfresh-token/entities/refresh-token.entity";
import { RefreshTokenStatus } from "src/common/enums/refresh-token/refresh-token-status.enum";
import { User } from "src/modules/user/entities/user.entity";
import { Tokens } from "../../classes/token.class";

describe("RotateRefreshTokenUseCase ( UnitTest )", () => {

    let service: RotateRefreshTokenUseCase;

    let createToken: jest.Mocked<CreateTokensUseCase>;
    let findRefreshToken: jest.Mocked<FindRefreshTokenWithUserService>;
    let findRoleNamesByUserId: jest.Mocked<FindAllRoleNamesByUserIdUseCase>;

    const mockCreateToken = {
        execute: jest.fn(),
    };

    const mockFindRefreshToken = {
        execute: jest.fn(),
    };

    const mockFindRoleNamesByUserId = {
        execute: jest.fn(),
    };

    const fakeTokenHash = "some-token-hash-string";

    const fakeUser: User = {
        id: "user-uuid-5678",
        name: "John Doe",
        fullName: "Johnathan Doe",
        email: "johndoe@example.com",
        passwordHash: "fake-password-hash",
        emailVerified: true,
        status: "ACTIVE" as any,
        lastLoginAt: null,
        version: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
    };

    const fakeRefreshToken: RefreshTokenEntity = {
        id: "token-uuid-1234",
        userId: fakeUser.id,
        tokenHash: fakeTokenHash,
        status: RefreshTokenStatus.ACTIVE,
        expiresAt: new Date(Date.now() + 86400000),
        revokedAt: null,
        replacedByTokenId: null,
        version: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
    };

    const fakeRoles = ["ADMIN", "USER"];

    const fakeTokens: Tokens = {
        token: "access-token",
        refreshToken: "refresh-token",
        refreshTokenExp: new Date(),
        tokenExp: new Date(),
    } as Tokens;

    const fakeFindResult = {
        isSuccess: true,
        isFailure: false,
        errors: [],
        status: 200,
        value: {
            refreshToken: fakeRefreshToken,
            user: fakeUser,
        },
    };

    const fakeRolesResult = {
        isSuccess: true,
        isFailure: false,
        errors: [],
        status: 200,
        value: fakeRoles,
    };

    const fakeTokensResult = {
        isSuccess: true,
        isFailure: false,
        errors: [],
        status: 201,
        value: fakeTokens,
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                RotateRefreshTokenUseCase,
                {
                    provide: CreateTokensUseCase,
                    useValue: mockCreateToken,
                },
                {
                    provide: FindRefreshTokenWithUserService,
                    useValue: mockFindRefreshToken,
                },
                {
                    provide: FindAllRoleNamesByUserIdUseCase,
                    useValue: mockFindRoleNamesByUserId,
                },
            ],
        }).compile();

        service = module.get<RotateRefreshTokenUseCase>(RotateRefreshTokenUseCase);
        createToken = module.get(CreateTokensUseCase);
        findRefreshToken = module.get(FindRefreshTokenWithUserService);
        findRoleNamesByUserId = module.get(FindAllRoleNamesByUserIdUseCase);
    });

    beforeEach(() => {
        jest.clearAllMocks();

        mockFindRefreshToken.execute.mockResolvedValue(fakeFindResult as any);
        mockFindRoleNamesByUserId.execute.mockResolvedValue(fakeRolesResult as any);
        mockCreateToken.execute.mockResolvedValue(fakeTokensResult as any);
    });

    it("should be defined and dependencies correctly mocked", () => {
        expect(service).toBeDefined();
        expect(createToken).toBeDefined();
        expect(findRefreshToken).toBeDefined();
        expect(findRoleNamesByUserId).toBeDefined();
    });

    describe("execute", () => {

        it("should successfully rotate token and return new tokens (Happy Path)", async () => {
            const result = await service.execute(fakeTokenHash);

            expect(result).toBeDefined();
            expect(result.isSuccess).toBe(true);
            expect(result.value).toEqual(fakeTokens);

            expect(findRefreshToken.execute).toHaveBeenCalledTimes(1);
            expect(findRefreshToken.execute).toHaveBeenCalledWith(fakeTokenHash);

            expect(findRoleNamesByUserId.execute).toHaveBeenCalledTimes(1);
            expect(findRoleNamesByUserId.execute).toHaveBeenCalledWith(fakeUser.id);

            expect(createToken.execute).toHaveBeenCalledTimes(1);
            expect(createToken.execute).toHaveBeenCalledWith(fakeUser, fakeRoles);
        });

        it("should return not found when refresh token result is null", async () => {
            mockFindRefreshToken.execute.mockResolvedValue({
                isSuccess: true,
                isFailure: false,
                errors: [],
                status: 200,
                value: null,
            } as any);

            const result = await service.execute(fakeTokenHash);

            expect(result.isSuccess).toBe(false);
            expect(result.errors[0]).toBe("Refresh token not found");

            expect(findRefreshToken.execute).toHaveBeenCalledTimes(1);
            expect(findRoleNamesByUserId.execute).not.toHaveBeenCalled();
            expect(createToken.execute).not.toHaveBeenCalled();
        });

        it("should return failure when findRefreshToken use case fails", async () => {
            mockFindRefreshToken.execute.mockResolvedValue({
                isSuccess: false,
                isFailure: true,
                errors: ["Repository failure"],
                status: 500,
                value: null,
            } as any);

            const result = await service.execute(fakeTokenHash);

            expect(result.isSuccess).toBe(false);
            expect(result.errors).toEqual(["Repository failure"]);
            expect(result.status).toBe(500);

            expect(findRoleNamesByUserId.execute).not.toHaveBeenCalled();
            expect(createToken.execute).not.toHaveBeenCalled();
        });

        it("should return bad request when token is expired", async () => {
            mockFindRefreshToken.execute.mockResolvedValue({
                isSuccess: true,
                isFailure: false,
                errors: [],
                status: 200,
                value: {
                    refreshToken: {
                        ...fakeRefreshToken,
                        expiresAt: new Date(Date.now() - 1000),
                    },
                    user: fakeUser,
                },
            } as any);

            const result = await service.execute(fakeTokenHash);

            expect(result.isSuccess).toBe(false);
            expect(result.errors[0]).toBe("Token expired");

            expect(findRoleNamesByUserId.execute).not.toHaveBeenCalled();
            expect(createToken.execute).not.toHaveBeenCalled();
        });

        it("should return bad request when token is revoked", async () => {
            mockFindRefreshToken.execute.mockResolvedValue({
                isSuccess: true,
                isFailure: false,
                errors: [],
                status: 200,
                value: {
                    refreshToken: {
                        ...fakeRefreshToken,
                        revokedAt: new Date(),
                    },
                    user: fakeUser,
                },
            } as any);

            const result = await service.execute(fakeTokenHash);

            expect(result.isSuccess).toBe(false);
            expect(result.errors[0]).toBe("Token revoked");

            expect(findRoleNamesByUserId.execute).not.toHaveBeenCalled();
            expect(createToken.execute).not.toHaveBeenCalled();
        });

        it("should return bad request when token is not active", async () => {
            mockFindRefreshToken.execute.mockResolvedValue({
                isSuccess: true,
                isFailure: false,
                errors: [],
                status: 200,
                value: {
                    refreshToken: {
                        ...fakeRefreshToken,
                        status: RefreshTokenStatus.REVOKED,
                    },
                    user: fakeUser,
                },
            } as any);

            const result = await service.execute(fakeTokenHash);

            expect(result.isSuccess).toBe(false);
            expect(result.errors[0]).toBe("Refresh token is not active");

            expect(findRoleNamesByUserId.execute).not.toHaveBeenCalled();
            expect(createToken.execute).not.toHaveBeenCalled();
        });

        it("should return failure when roles lookup fails", async () => {
            mockFindRoleNamesByUserId.execute.mockResolvedValue({
                isSuccess: false,
                isFailure: true,
                errors: ["Roles lookup failed"],
                status: 500,
                value: null,
            } as any);

            const result = await service.execute(fakeTokenHash);

            expect(result.isSuccess).toBe(false);
            expect(result.errors).toEqual(["Roles lookup failed"]);
            expect(result.status).toBe(500);

            expect(findRoleNamesByUserId.execute).toHaveBeenCalledTimes(1);
            expect(createToken.execute).not.toHaveBeenCalled();
        });

        it("should return failure when createToken fails", async () => {
            mockCreateToken.execute.mockResolvedValue({
                isSuccess: false,
                isFailure: true,
                errors: ["Token creation failed"],
                status: 500,
                value: null,
            } as any);

            const result = await service.execute(fakeTokenHash);

            expect(result.isSuccess).toBe(false);
            expect(result.errors).toEqual(["Token creation failed"]);
            expect(result.status).toBe(500);

            expect(findRefreshToken.execute).toHaveBeenCalledTimes(1);
            expect(findRoleNamesByUserId.execute).toHaveBeenCalledTimes(1);
            expect(createToken.execute).toHaveBeenCalledTimes(1);
        });
    });
});
