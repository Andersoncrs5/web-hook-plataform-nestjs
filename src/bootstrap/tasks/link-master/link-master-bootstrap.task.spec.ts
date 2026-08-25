import { Test, TestingModule } from "@nestjs/testing";
import { ConfigService } from "@nestjs/config";
import { InternalServerErrorException } from "@nestjs/common";

import { CreateUserRoleService } from "src/modules/user-role/services/create/create-user-role.use-case.service";
import { FindRoleByNameUseCase } from "src/modules/roles/services/find-name/find-role-by-name.use-case.service";
import { FindUserByEmailUseCase } from "src/modules/user/services/find-email/find-user-email.use-case.service";
import { ExistsByRoleIdAndUserIdUseCase } from "src/modules/user-role/services/exists-by-role-id-user-id/exists-by-role-id-user-id.use-case.service";
import { Result } from "src/common/result/result";
import { LinkRoleMasterToMasterBootstrapTask } from "./link-master-bootstrap.task";

describe("LinkRoleMasterToMasterBootstrapTask (UnitTest)", () => {
    let task: LinkRoleMasterToMasterBootstrapTask;
    let createUserRoleService: jest.Mocked<CreateUserRoleService>;
    let findRoleByNameUseCase: jest.Mocked<FindRoleByNameUseCase>;
    let findUserByEmailUseCase: jest.Mocked<FindUserByEmailUseCase>;
    let existsByRoleIdAndUserIdUseCase: jest.Mocked<ExistsByRoleIdAndUserIdUseCase>;
    let configService: jest.Mocked<ConfigService>;

    const mockMasterUser = {
        id: "user-uuid-123",
        name: "Master User",
        email: "master@domain.com",
    };

    const mockMasterRole = {
        id: "role-uuid-456",
        name: "MASTER",
    };

    const mockCreateUserRoleService = {
        execute: jest.fn(),
    };

    const mockFindRoleByNameUseCase = {
        execute: jest.fn(),
    };

    const mockFindUserByEmailUseCase = {
        execute: jest.fn(),
    };

    const mockExistsByRoleIdAndUserIdUseCase = {
        execute: jest.fn(),
    };

    const mockConfigService = {
        getOrThrow: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                LinkRoleMasterToMasterBootstrapTask,
                { provide: CreateUserRoleService, useValue: mockCreateUserRoleService },
                { provide: FindRoleByNameUseCase, useValue: mockFindRoleByNameUseCase },
                { provide: FindUserByEmailUseCase, useValue: mockFindUserByEmailUseCase },
                { provide: ExistsByRoleIdAndUserIdUseCase, useValue: mockExistsByRoleIdAndUserIdUseCase },
                { provide: ConfigService, useValue: mockConfigService },
            ],
        }).compile();

        task = module.get<LinkRoleMasterToMasterBootstrapTask>(LinkRoleMasterToMasterBootstrapTask);
        createUserRoleService = module.get(CreateUserRoleService);
        findRoleByNameUseCase = module.get(FindRoleByNameUseCase);
        findUserByEmailUseCase = module.get(FindUserByEmailUseCase);
        existsByRoleIdAndUserIdUseCase = module.get(ExistsByRoleIdAndUserIdUseCase);
        configService = module.get(ConfigService);
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should be defined and dependencies correctly injected", () => {
        expect(task).toBeDefined();
        expect(createUserRoleService).toBeDefined();
        expect(findRoleByNameUseCase).toBeDefined();
        expect(findUserByEmailUseCase).toBeDefined();
        expect(existsByRoleIdAndUserIdUseCase).toBeDefined();
        expect(configService).toBeDefined();
    });

    describe("execute", () => {
        const emailMaster = "master@domain.com";

        it("should successfully link MASTER role to master user when association does not exist (Happy Path)", async () => {
            configService.getOrThrow.mockReturnValue(emailMaster);
            findUserByEmailUseCase.execute.mockResolvedValue(Result.ok(mockMasterUser as any));
            findRoleByNameUseCase.execute.mockResolvedValue(Result.ok(mockMasterRole as any));
            existsByRoleIdAndUserIdUseCase.execute.mockResolvedValue(Result.ok(false));
            createUserRoleService.execute.mockResolvedValue(Result.ok({ id: "user-role-id" } as any));

            await expect(task.execute()).resolves.not.toThrow();

            expect(configService.getOrThrow).toHaveBeenCalledWith("EMAIL_MASTER");
            expect(findUserByEmailUseCase.execute).toHaveBeenCalledWith(emailMaster);
            expect(findRoleByNameUseCase.execute).toHaveBeenCalledWith("MASTER");
            expect(existsByRoleIdAndUserIdUseCase.execute).toHaveBeenCalledWith(
                mockMasterRole.id,
                mockMasterUser.id,
            );
            expect(createUserRoleService.execute).toHaveBeenCalledWith({
                roleId: mockMasterRole.id,
                userId: mockMasterUser.id,
            });
        });

        it("should return early when association between MASTER role and user already exists", async () => {
            configService.getOrThrow.mockReturnValue(emailMaster);
            findUserByEmailUseCase.execute.mockResolvedValue(Result.ok(mockMasterUser as any));
            findRoleByNameUseCase.execute.mockResolvedValue(Result.ok(mockMasterRole as any));
            existsByRoleIdAndUserIdUseCase.execute.mockResolvedValue(Result.ok(true));

            await expect(task.execute()).resolves.not.toThrow();

            expect(existsByRoleIdAndUserIdUseCase.execute).toHaveBeenCalledWith(
                mockMasterRole.id,
                mockMasterUser.id,
            );
            expect(createUserRoleService.execute).not.toHaveBeenCalled();
        });

        describe("Failure Scenarios & Exceptions", () => {
            it("should throw InternalServerErrorException when finding user fails", async () => {
                configService.getOrThrow.mockReturnValue(emailMaster);
                findUserByEmailUseCase.execute.mockResolvedValue(
                    Result.notFound("User not found") as any,
                );

                await expect(task.execute()).rejects.toThrow(
                    new InternalServerErrorException(
                        `Failed to find master user with email "${emailMaster}".`,
                    ),
                );

                expect(findRoleByNameUseCase.execute).not.toHaveBeenCalled();
            });

            it("should throw InternalServerErrorException when finding MASTER role fails", async () => {
                configService.getOrThrow.mockReturnValue(emailMaster);
                findUserByEmailUseCase.execute.mockResolvedValue(Result.ok(mockMasterUser as any));
                findRoleByNameUseCase.execute.mockResolvedValue(
                    Result.notFound("Role not found") as any,
                );

                await expect(task.execute()).rejects.toThrow(
                    new InternalServerErrorException(`Failed to find "MASTER" role.`),
                );

                expect(existsByRoleIdAndUserIdUseCase.execute).not.toHaveBeenCalled();
            });

            it("should throw InternalServerErrorException when checking association fails", async () => {
                configService.getOrThrow.mockReturnValue(emailMaster);
                findUserByEmailUseCase.execute.mockResolvedValue(Result.ok(mockMasterUser as any));
                findRoleByNameUseCase.execute.mockResolvedValue(Result.ok(mockMasterRole as any));
                existsByRoleIdAndUserIdUseCase.execute.mockResolvedValue(
                    Result.failure(["DB Error"], 500) as any,
                );

                await expect(task.execute()).rejects.toThrow(
                    new InternalServerErrorException(
                        `Failed to check association between MASTER role and master user.`,
                    ),
                );

                expect(createUserRoleService.execute).not.toHaveBeenCalled();
            });

            it("should throw Error when creating user-role link fails", async () => {
                configService.getOrThrow.mockReturnValue(emailMaster);
                findUserByEmailUseCase.execute.mockResolvedValue(Result.ok(mockMasterUser as any));
                findRoleByNameUseCase.execute.mockResolvedValue(Result.ok(mockMasterRole as any));
                existsByRoleIdAndUserIdUseCase.execute.mockResolvedValue(Result.ok(false));
                createUserRoleService.execute.mockResolvedValue(
                    Result.failure(["Failed to create link"], 500) as any,
                );

                await expect(task.execute()).rejects.toThrow(
                    new Error(`Failed to link MASTER role to master user "${emailMaster}".`),
                );
            });

            it("should propagate error if ConfigService throws when variable is missing", async () => {
                configService.getOrThrow.mockImplementation(() => {
                    throw new Error("Configuration key EMAIL_MASTER does not exist");
                });

                await expect(task.execute()).rejects.toThrow(
                    "Configuration key EMAIL_MASTER does not exist",
                );

                expect(findUserByEmailUseCase.execute).not.toHaveBeenCalled();
            });
        });
    });
});