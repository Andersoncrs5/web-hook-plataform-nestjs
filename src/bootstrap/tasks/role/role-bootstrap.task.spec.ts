import { Test, TestingModule } from "@nestjs/testing";
import { ConfigService } from "@nestjs/config";
import { InternalServerErrorException } from "@nestjs/common";

import { RoleBootstrapTask } from "./role-bootstrap.task";
import { CreateRoleUseCase } from "src/modules/roles/services/create-role/create-role.use-case.service";
import { CheckRoleExistsByNameUseCase } from "src/modules/roles/services/exists-name/check-role-exists-by-name.use-case.service";
import { Result } from "src/common/result/result";

describe("RoleBootstrapTask (UnitTest)", () => {
    let task: RoleBootstrapTask;
    let createRoleUseCase: jest.Mocked<CreateRoleUseCase>;
    let checkRoleExistsByNameUseCase: jest.Mocked<CheckRoleExistsByNameUseCase>;
    let configService: jest.Mocked<ConfigService>;

    const mockCreateRoleUseCase = {
        execute: jest.fn(),
    };

    const mockCheckRoleExistsByNameUseCase = {
        execute: jest.fn(),
    };

    const mockConfigService = {
        getOrThrow: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                RoleBootstrapTask,
                { provide: CreateRoleUseCase, useValue: mockCreateRoleUseCase },
                { provide: CheckRoleExistsByNameUseCase, useValue: mockCheckRoleExistsByNameUseCase },
                { provide: ConfigService, useValue: mockConfigService },
            ],
        }).compile();

        task = module.get<RoleBootstrapTask>(RoleBootstrapTask);
        createRoleUseCase = module.get(CreateRoleUseCase);
        checkRoleExistsByNameUseCase = module.get(CheckRoleExistsByNameUseCase);
        configService = module.get(ConfigService);
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should be defined and dependencies correctly injected", () => {
        expect(task).toBeDefined();
        expect(createRoleUseCase).toBeDefined();
        expect(checkRoleExistsByNameUseCase).toBeDefined();
        expect(configService).toBeDefined();
    });

    describe("execute", () => {
        it("should successfully create roles when input is an array (Happy Path)", async () => {
            const rolesArray = ["USER", "ADMIN", "MASTER"];
            configService.getOrThrow.mockReturnValue(rolesArray);

            checkRoleExistsByNameUseCase.execute.mockResolvedValue(Result.ok(false));
            createRoleUseCase.execute.mockResolvedValue(Result.ok({ id: "role-uuid" } as any));

            await expect(task.execute()).resolves.not.toThrow();

            expect(configService.getOrThrow).toHaveBeenCalledWith("ROLES");
            expect(checkRoleExistsByNameUseCase.execute).toHaveBeenCalledTimes(3);
            expect(createRoleUseCase.execute).toHaveBeenCalledTimes(3);

            expect(createRoleUseCase.execute).toHaveBeenCalledWith({
                name: "MASTER",
                description: "Default MASTER role",
                isActive: true,
            });
        });

        it("should successfully parse and create roles when input is a comma-separated string (Happy Path)", async () => {
            const rolesString = "USER, ADMIN, MASTER";
            configService.getOrThrow.mockReturnValue(rolesString);

            checkRoleExistsByNameUseCase.execute.mockResolvedValue(Result.ok(false));
            createRoleUseCase.execute.mockResolvedValue(Result.ok({ id: "role-uuid" } as any));

            await expect(task.execute()).resolves.not.toThrow();

            expect(checkRoleExistsByNameUseCase.execute).toHaveBeenNthCalledWith(1, "USER");
            expect(checkRoleExistsByNameUseCase.execute).toHaveBeenNthCalledWith(2, "ADMIN");
            expect(checkRoleExistsByNameUseCase.execute).toHaveBeenNthCalledWith(3, "MASTER");

            expect(createRoleUseCase.execute).toHaveBeenCalledTimes(3);
        });

        it("should skip creating roles that already exist", async () => {
            configService.getOrThrow.mockReturnValue(["USER", "MASTER"]);

            // "USER" já existe (true), "MASTER" não existe (false)
            checkRoleExistsByNameUseCase.execute
                .mockResolvedValueOnce(Result.ok(true))
                .mockResolvedValueOnce(Result.ok(false));

            createRoleUseCase.execute.mockResolvedValue(Result.ok({ id: "role-uuid" } as any));

            await expect(task.execute()).resolves.not.toThrow();

            expect(checkRoleExistsByNameUseCase.execute).toHaveBeenCalledTimes(2);
            expect(createRoleUseCase.execute).toHaveBeenCalledTimes(1);
            expect(createRoleUseCase.execute).toHaveBeenCalledWith({
                name: "MASTER",
                description: "Default MASTER role",
                isActive: true,
            });
        });

        describe("Failure Scenarios & Exceptions", () => {
            it("should throw InternalServerErrorException when MASTER role is missing from array", async () => {
                configService.getOrThrow.mockReturnValue(["USER", "ADMIN"]);

                await expect(task.execute()).rejects.toThrow(
                    new InternalServerErrorException(
                        'Required role "MASTER" is missing from ROLES environment configuration.',
                    ),
                );

                expect(checkRoleExistsByNameUseCase.execute).not.toHaveBeenCalled();
                expect(createRoleUseCase.execute).not.toHaveBeenCalled();
            });

            it("should throw InternalServerErrorException when MASTER role is missing from string", async () => {
                configService.getOrThrow.mockReturnValue("USER, ADMIN, SUPPORT");

                await expect(task.execute()).rejects.toThrow(
                    new InternalServerErrorException(
                        'Required role "MASTER" is missing from ROLES environment configuration.',
                    ),
                );

                expect(checkRoleExistsByNameUseCase.execute).not.toHaveBeenCalled();
            });

            it("should throw Error when checkRoleExistsByNameUseCase returns a failure Result", async () => {
                configService.getOrThrow.mockReturnValue(["MASTER"]);
                checkRoleExistsByNameUseCase.execute.mockResolvedValue(
                    Result.failure(["Database connection error"], 500) as any,
                );

                await expect(task.execute()).rejects.toThrow(
                    new Error('Failed to check role "MASTER" existence.'),
                );

                expect(createRoleUseCase.execute).not.toHaveBeenCalled();
            });

            it("should throw Error when createRoleUseCase returns a failure Result", async () => {
                configService.getOrThrow.mockReturnValue(["MASTER"]);
                checkRoleExistsByNameUseCase.execute.mockResolvedValue(Result.ok(false));
                createRoleUseCase.execute.mockResolvedValue(
                    Result.failure(["Failed to insert role"], 500) as any,
                );

                await expect(task.execute()).rejects.toThrow(
                    new Error('Failed to create default role "MASTER".'),
                );
            });

            it("should propagate error when ConfigService fails to retrieve ROLES", async () => {
                configService.getOrThrow.mockImplementation(() => {
                    throw new Error("Configuration key ROLES does not exist");
                });

                await expect(task.execute()).rejects.toThrow(
                    "Configuration key ROLES does not exist",
                );

                expect(checkRoleExistsByNameUseCase.execute).not.toHaveBeenCalled();
            });
        });
    });
});