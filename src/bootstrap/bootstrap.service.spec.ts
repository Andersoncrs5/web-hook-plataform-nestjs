import { Test, TestingModule } from "@nestjs/testing";
import { BootstrapService } from "./bootstrap.service";
import { BOOTSTRAP_TASK, BootstrapTask } from "./contracts/bootstrap-task.interface";

describe("BootstrapService (UnitTest)", () => {
    let service: BootstrapService;

    // Mocks para tarefas de bootstrap
    const mockTask1: jest.Mocked<BootstrapTask> = {
        execute: jest.fn(),
    };

    const mockTask2: jest.Mocked<BootstrapTask> = {
        execute: jest.fn(),
    };

    const mockTasks: BootstrapTask[] = [mockTask1, mockTask2];

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                BootstrapService,
                {
                    provide: BOOTSTRAP_TASK,
                    useValue: mockTasks,
                },
            ],
        }).compile();

        service = module.get<BootstrapService>(BootstrapService);
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should be defined and inject BOOTSTRAP_TASK array", () => {
        expect(service).toBeDefined();
    });

    describe("onApplicationBootstrap", () => {
        it("should call execute when lifecycle hook triggers", async () => {
            const executeSpy = jest.spyOn(service, "execute").mockResolvedValue();

            await service.onApplicationBootstrap();

            expect(executeSpy).toHaveBeenCalledTimes(1);
        });
    });

    describe("execute", () => {
        it("should execute all tasks sequentially in the registered order (Happy Path)", async () => {
            const executionOrder: string[] = [];

            mockTask1.execute.mockImplementation(async () => {
                executionOrder.push("task1");
            });

            mockTask2.execute.mockImplementation(async () => {
                executionOrder.push("task2");
            });

            await service.execute();

            expect(mockTask1.execute).toHaveBeenCalledTimes(1);
            expect(mockTask2.execute).toHaveBeenCalledTimes(1);
            expect(executionOrder).toEqual(["task1", "task2"]);
        });

        it("should work seamlessly when task list is empty", async () => {
            const module: TestingModule = await Test.createTestingModule({
                providers: [
                    BootstrapService,
                    {
                        provide: BOOTSTRAP_TASK,
                        useValue: [],
                    },
                ],
            }).compile();

            const emptyService = module.get<BootstrapService>(BootstrapService);

            await expect(emptyService.execute()).resolves.not.toThrow();
        });

        describe("Failure Scenarios", () => {
            it("should throw and interrupt pipeline if a task fails", async () => {
                const taskError = new Error("Task execution failed");
                mockTask1.execute.mockRejectedValue(taskError);

                await expect(service.execute()).rejects.toThrow(taskError);

                expect(mockTask1.execute).toHaveBeenCalledTimes(1);
                // Garante que a segunda tarefa NÃO é executada após a falha da primeira
                expect(mockTask2.execute).not.toHaveBeenCalled();
            });
        });
    });
});