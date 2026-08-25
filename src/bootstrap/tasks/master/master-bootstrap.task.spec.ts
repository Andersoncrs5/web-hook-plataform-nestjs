import { Test, TestingModule } from "@nestjs/testing";
import { ConfigService } from "@nestjs/config";
import { InternalServerErrorException } from "@nestjs/common";

import { MasterBootstrapTask } from "./master-bootstrap.task";
import { CreateUserUseCase } from "src/modules/user/services/create-user/create-user.use-case.service";
import { ExistsUserByEmailUseCase } from "src/modules/user/services/exists-email/exists-by-email.service";
import { Result } from "src/common/result/result";

describe("MasterBootstrapTask (UnitTest)", () => {
    let task: MasterBootstrapTask;
    let createUserUseCase: jest.Mocked<CreateUserUseCase>;
    let existsUserByEmailUseCase: jest.Mocked<ExistsUserByEmailUseCase>;
    let configService: jest.Mocked<ConfigService>;

    const mockConfig = {
        EMAIL_MASTER: "master@domain.com",
        PASSWORD_MASTER: "MasterPassword123!",
        NAME_MASTER: "Master",
        FULL_NAME_MASTER: "Master Admin System",
    };

    const mockCreateUserUseCase = {
        execute: jest.fn(),
    };

    const mockExistsUserByEmailUseCase = {
        execute: jest.fn(),
    };

    const mockConfigService = {
        getOrThrow: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                MasterBootstrapTask,
                { provide: CreateUserUseCase, useValue: mockCreateUserUseCase },
                { provide: ExistsUserByEmailUseCase, useValue: mockExistsUserByEmailUseCase },
                { provide: ConfigService, useValue: mockConfigService },
            ],
        }).compile();

        task = module.get<MasterBootstrapTask>(MasterBootstrapTask);
        createUserUseCase = module.get(CreateUserUseCase);
        existsUserByEmailUseCase = module.get(ExistsUserByEmailUseCase);
        configService = module.get(ConfigService);
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should be defined and dependencies correctly injected", () => {
        expect(task).toBeDefined();
        expect(createUserUseCase).toBeDefined();
        expect(existsUserByEmailUseCase).toBeDefined();
        expect(configService).toBeDefined();
    });

    describe("execute", () => {
        it("should successfully create the master user when it does not exist (Happy Path)", async () => {
            configService.getOrThrow.mockImplementation((key: string) => mockConfig[key]);
            existsUserByEmailUseCase.execute.mockResolvedValue(Result.ok(false));
            createUserUseCase.execute.mockResolvedValue(Result.ok({ id: "user-uuid-123" } as any));

            await expect(task.execute()).resolves.not.toThrow();

            expect(configService.getOrThrow).toHaveBeenCalledWith("EMAIL_MASTER");
            expect(configService.getOrThrow).toHaveBeenCalledWith("PASSWORD_MASTER");
            expect(configService.getOrThrow).toHaveBeenCalledWith("NAME_MASTER");
            expect(configService.getOrThrow).toHaveBeenCalledWith("FULL_NAME_MASTER");
            
            expect(existsUserByEmailUseCase.execute).toHaveBeenCalledWith(mockConfig.EMAIL_MASTER);
            expect(createUserUseCase.execute).toHaveBeenCalledWith({
                name: mockConfig.NAME_MASTER,
                email: mockConfig.EMAIL_MASTER,
                fullName: mockConfig.FULL_NAME_MASTER,
                password: mockConfig.PASSWORD_MASTER,
            });
        });

        it("should return early without creating a user when master email already exists", async () => {
            configService.getOrThrow.mockImplementation((key: string) => mockConfig[key]);
            existsUserByEmailUseCase.execute.mockResolvedValue(Result.ok(true));

            await expect(task.execute()).resolves.not.toThrow();

            expect(existsUserByEmailUseCase.execute).toHaveBeenCalledWith(mockConfig.EMAIL_MASTER);
            expect(createUserUseCase.execute).not.toHaveBeenCalled();
        });

        describe("Failure Scenarios & Exceptions", () => {
            it("should throw InternalServerErrorException when checking user existence fails", async () => {
                configService.getOrThrow.mockImplementation((key: string) => mockConfig[key]);
                existsUserByEmailUseCase.execute.mockResolvedValue(
                    Result.failure(["Database error"], 500) as any,
                );

                await expect(task.execute()).rejects.toThrow(
                    new InternalServerErrorException(
                        `Failed to check master user existence for email "${mockConfig.EMAIL_MASTER}".`,
                    ),
                );

                expect(createUserUseCase.execute).not.toHaveBeenCalled();
            });

            it("should throw Error when creating master user fails", async () => {
                configService.getOrThrow.mockImplementation((key: string) => mockConfig[key]);
                existsUserByEmailUseCase.execute.mockResolvedValue(Result.ok(false));
                createUserUseCase.execute.mockResolvedValue(
                    Result.failure(["User creation failed"], 500) as any,
                );

                await expect(task.execute()).rejects.toThrow(
                    new Error(`Failed to create master user "${mockConfig.EMAIL_MASTER}".`),
                );
            });

            it("should propagate exception when ConfigService throws missing key error", async () => {
                configService.getOrThrow.mockImplementation(() => {
                    throw new Error("Configuration key EMAIL_MASTER does not exist");
                });

                await expect(task.execute()).rejects.toThrow(
                    "Configuration key EMAIL_MASTER does not exist",
                );

                expect(existsUserByEmailUseCase.execute).not.toHaveBeenCalled();
                expect(createUserUseCase.execute).not.toHaveBeenCalled();
            });
        });
    });
});