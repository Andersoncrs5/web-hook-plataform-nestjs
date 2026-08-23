import { Test, TestingModule } from "@nestjs/testing";

import { RegisterUserService } from "./register-user.use-case.service";
import { CreateUserUseCase } from "src/modules/user/services/create-user/create-user.use-case.service";
import { CreateTokensUseCase } from "../create-token/create-token.use-case.service";
import { FindUserRoleByUserIdJustRoleIdUseCase } from "src/modules/user-role/services/find-by-user-id/find-by-user-id.use-case.service";
import { FindRoleByIds } from "src/modules/roles/services/find-role-by-ids/find-role-by-ids.use-case.service";

import { CreateUserDto } from "src/modules/user/dto/create-user.dto";
import { User } from "src/modules/user/entities/user.entity";
import { Role } from "src/modules/roles/entities/role.entity";
import { Tokens } from "../../classes/token.class";

describe("RegisterUserService ( UnitTest )", () => {

    let service: RegisterUserService;

    let createUser: jest.Mocked<CreateUserUseCase>;
    let createTokens: jest.Mocked<CreateTokensUseCase>;
    let findUserRoleByUserIdJustRoleId:
        jest.Mocked<FindUserRoleByUserIdJustRoleIdUseCase>;
    let findRolesById: jest.Mocked<FindRoleByIds>;

    const mockCreateUser = {
        execute: jest.fn(),
    };

    const mockCreateTokens = {
        execute: jest.fn(),
    };

    const mockFindUserRoleByUserIdJustRoleId = {
        execute: jest.fn(),
    };

    const mockFindRolesById = {
        execute: jest.fn(),
    };

    const fakeDto: CreateUserDto = {
        name: "John Doe",
        email: "johndoe@example.com",
        password: "securePassword123",
    } as CreateUserDto;

    const fakeUser: User = {
        id: "user-uuid-1234",
        name: "John Doe",
        fullName: "Johnathan Doe",
        email: fakeDto.email,
        passwordHash: "$argon2id$v=19$m=65536,t=3,p=4$fakehash",
        emailVerified: false,
        status: "ACTIVE" as any,
        lastLoginAt: null,
        version: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
    };

    const fakeRoleIds = [
        "role-uuid-1",
        "role-uuid-2",
    ];

    const fakeRoles: Role[] = [
        {
            id: "role-uuid-1",
            name: "ADMIN",
            description: "Administrator",
            isActive: true,
            version: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: null,
        } as Role,
        {
            id: "role-uuid-2",
            name: "USER",
            description: "Regular user",
            isActive: true,
            version: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: null,
        } as Role,
    ];

    const fakeTokens: Tokens = {
        token: "access-token",
        refreshToken: "refresh-token",
        refreshTokenExp: new Date(),
        tokenExp: new Date(),
    } as Tokens;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                RegisterUserService,
                {
                    provide: CreateUserUseCase,
                    useValue: mockCreateUser,
                },
                {
                    provide: CreateTokensUseCase,
                    useValue: mockCreateTokens,
                },
                {
                    provide: FindUserRoleByUserIdJustRoleIdUseCase,
                    useValue: mockFindUserRoleByUserIdJustRoleId,
                },
                {
                    provide: FindRoleByIds,
                    useValue: mockFindRolesById,
                },
            ],
        }).compile();

        service = module.get<RegisterUserService>(RegisterUserService);
        createUser = module.get(CreateUserUseCase);
        createTokens = module.get(CreateTokensUseCase);
        findUserRoleByUserIdJustRoleId = module.get(
            FindUserRoleByUserIdJustRoleIdUseCase,
        );
        findRolesById = module.get(FindRoleByIds);
    });

    beforeEach(() => {
        jest.clearAllMocks();

        mockCreateUser.execute.mockResolvedValue({
            isSuccess: true,
            isFailure: false,
            errors: [],
            status: 201,
            value: fakeUser,
        } as any);

        mockFindUserRoleByUserIdJustRoleId.execute.mockResolvedValue({
            isSuccess: true,
            isFailure: false,
            errors: [],
            status: 200,
            value: fakeRoleIds,
        } as any);

        mockFindRolesById.execute.mockResolvedValue({
            isSuccess: true,
            isFailure: false,
            errors: [],
            status: 200,
            value: fakeRoles,
        } as any);

        mockCreateTokens.execute.mockResolvedValue({
            isSuccess: true,
            isFailure: false,
            errors: [],
            status: 200,
            value: fakeTokens,
        } as any);
    });

    it("should be defined and dependencies correctly mocked", () => {
        expect(service).toBeDefined();
        expect(createUser).toBeDefined();
        expect(createTokens).toBeDefined();
        expect(findUserRoleByUserIdJustRoleId).toBeDefined();
        expect(findRolesById).toBeDefined();
    });

    describe("execute", () => {

        it("should successfully register user and return tokens (Happy Path)", async () => {
            const result = await service.execute(fakeDto);

            expect(result).toBeDefined();
            expect(result.isSuccess).toBe(true);
            expect(result.value).toEqual(fakeTokens);

            expect(createUser.execute).toHaveBeenCalledTimes(1);
            expect(createUser.execute).toHaveBeenCalledWith(fakeDto);

            expect(findUserRoleByUserIdJustRoleId.execute).toHaveBeenCalledTimes(1);
            expect(findUserRoleByUserIdJustRoleId.execute).toHaveBeenCalledWith(
                fakeUser.id,
            );

            expect(findRolesById.execute).toHaveBeenCalledTimes(1);
            expect(findRolesById.execute).toHaveBeenCalledWith(fakeRoleIds);

            expect(createTokens.execute).toHaveBeenCalledTimes(1);
            expect(createTokens.execute).toHaveBeenCalledWith(
                fakeUser,
                fakeRoles.map((role) => role.name),
            );
        });

        it("should return failure when createUser fails", async () => {
            mockCreateUser.execute.mockResolvedValue({
                isSuccess: false,
                isFailure: true,
                errors: ["Email already exists"],
                status: 400,
                value: null,
            } as any);

            const result = await service.execute(fakeDto);

            expect(result.isSuccess).toBe(false);
            expect(result.errors).toEqual(["Email already exists"]);
            expect(result.status).toBe(400);

            expect(findUserRoleByUserIdJustRoleId.execute).not.toHaveBeenCalled();
            expect(findRolesById.execute).not.toHaveBeenCalled();
            expect(createTokens.execute).not.toHaveBeenCalled();
        });

        it("should return failure when user-role lookup fails", async () => {
            mockFindUserRoleByUserIdJustRoleId.execute.mockResolvedValue({
                isSuccess: false,
                isFailure: true,
                errors: ["User roles lookup failed"],
                status: 500,
                value: null,
            } as any);

            const result = await service.execute(fakeDto);

            expect(result.isSuccess).toBe(false);
            expect(result.errors).toEqual(["User roles lookup failed"]);
            expect(result.status).toBe(500);

            expect(findRolesById.execute).not.toHaveBeenCalled();
            expect(createTokens.execute).not.toHaveBeenCalled();
        });

        it("should return success even when user has no roles", async () => {
            mockFindUserRoleByUserIdJustRoleId.execute.mockResolvedValue({
                isSuccess: true,
                isFailure: false,
                errors: [],
                status: 200,
                value: [],
            } as any);

            mockCreateTokens.execute.mockResolvedValue({
                isSuccess: true,
                isFailure: false,
                errors: [],
                status: 200,
                value: fakeTokens,
            } as any);

            const result = await service.execute(fakeDto);

            expect(result.isSuccess).toBe(true);
            expect(result.value).toEqual(fakeTokens);

            expect(findRolesById.execute).not.toHaveBeenCalled();
            expect(createTokens.execute).toHaveBeenCalledTimes(1);
            expect(createTokens.execute).toHaveBeenCalledWith(fakeUser, []);
        });

        it("should return failure when role lookup fails", async () => {
            mockFindRolesById.execute.mockResolvedValue({
                isSuccess: false,
                isFailure: true,
                errors: ["Roles lookup failed"],
                status: 500,
                value: null,
            } as any);

            const result = await service.execute(fakeDto);

            expect(result.isSuccess).toBe(false);
            expect(result.errors).toEqual(["Roles lookup failed"]);
            expect(result.status).toBe(500);

            expect(createTokens.execute).not.toHaveBeenCalled();
        });

        it("should return failure when token creation fails", async () => {
            mockCreateTokens.execute.mockResolvedValue({
                isSuccess: false,
                isFailure: true,
                errors: ["Token creation failed"],
                status: 500,
                value: null,
            } as any);

            const result = await service.execute(fakeDto);

            expect(result.isSuccess).toBe(false);
            expect(result.errors).toEqual(["Token creation failed"]);
            expect(result.status).toBe(500);

            expect(createTokens.execute).toHaveBeenCalledTimes(1);
        });

        it("should throw InternalServerErrorException on unexpected error", async () => {
            const error = new Error("Unexpected registration failure");

            mockCreateUser.execute.mockRejectedValue(error);

            await expect(service.execute(fakeDto)).rejects.toThrow(
                "An unexpected error occurred during user registration.",
            );
        });
    });
});