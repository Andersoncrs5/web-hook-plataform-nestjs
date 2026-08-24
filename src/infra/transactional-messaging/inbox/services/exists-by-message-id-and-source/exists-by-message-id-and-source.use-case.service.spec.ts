import { Test, TestingModule } from "@nestjs/testing";

import { IInboxRepository } from "../../repository/iinbox.repository";
import { ExistsInboxByMessageIdAndSourceUseCase } from "./exists-by-message-id-and-source.use-case.service";

describe("ExistsInboxByMessageIdAndSourceUseCase ( UnitTest )", () => {

    let service: ExistsInboxByMessageIdAndSourceUseCase;
    let repository: jest.Mocked<IInboxRepository>;

    const mockRepository = {
        existsByMessageIdAndSource: jest.fn(),
    };

    const fakeMessageId = "550e8400-e29b-41d4-a716-446655440000";
    const fakeSource = "payment-service";

    beforeEach(async () => {

        const module: TestingModule =
            await Test.createTestingModule({
                providers: [
                    ExistsInboxByMessageIdAndSourceUseCase,
                    {
                        provide: IInboxRepository,
                        useValue: mockRepository,
                    },
                ],
            }).compile();

        service =
            module.get<ExistsInboxByMessageIdAndSourceUseCase>(
                ExistsInboxByMessageIdAndSourceUseCase,
            );

        repository =
            module.get(
                IInboxRepository,
            );
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should be defined and dependencies correctly mocked", () => {

        expect(service).toBeDefined();
        expect(repository).toBeDefined();

    });

    describe("execute", () => {

        it("should return true when inbox message already exists", async () => {

            // Arrange
            repository.existsByMessageIdAndSource
                .mockResolvedValue(true);

            // Act
            const result = await service.execute(
                fakeMessageId,
                fakeSource,
            );

            // Assert
            expect(result).toBeDefined();
            expect(result.isSuccess).toBe(true);
            expect(result.value).toBe(true);

            // Verify
            expect(
                repository.existsByMessageIdAndSource,
            ).toHaveBeenCalledTimes(1);

            expect(
                repository.existsByMessageIdAndSource,
            ).toHaveBeenCalledWith(
                fakeMessageId,
                fakeSource,
            );
        });

        it("should return false when inbox message does not exist", async () => {

            // Arrange
            repository.existsByMessageIdAndSource
                .mockResolvedValue(false);

            // Act
            const result = await service.execute(
                fakeMessageId,
                fakeSource,
            );

            // Assert
            expect(result).toBeDefined();
            expect(result.isSuccess).toBe(true);
            expect(result.value).toBe(false);

            // Verify
            expect(
                repository.existsByMessageIdAndSource,
            ).toHaveBeenCalledTimes(1);

            expect(
                repository.existsByMessageIdAndSource,
            ).toHaveBeenCalledWith(
                fakeMessageId,
                fakeSource,
            );
        });

        it("should return bad request when messageId is not a valid UUID", async () => {

            // Arrange
            const invalidMessageId = "message-uuid-1234";

            // Act
            const result = await service.execute(
                invalidMessageId,
                fakeSource,
            );

            // Assert
            expect(result).toBeDefined();
            expect(result.isSuccess).toBe(false);
            expect(result.errors[0]).toBe("Id should be UUID");

            // Verify
            expect(
                repository.existsByMessageIdAndSource,
            ).not.toHaveBeenCalled();
        });

        it("should propagate repository error", async () => {

            // Arrange
            const repositoryError =
                new Error("Database connection failed");

            repository.existsByMessageIdAndSource
                .mockRejectedValue(repositoryError);

            // Act & Assert
            await expect(
                service.execute(
                    fakeMessageId,
                    fakeSource,
                ),
            ).rejects.toThrow(
                "Database connection failed",
            );

            // Verify
            expect(
                repository.existsByMessageIdAndSource,
            ).toHaveBeenCalledTimes(1);

            expect(
                repository.existsByMessageIdAndSource,
            ).toHaveBeenCalledWith(
                fakeMessageId,
                fakeSource,
            );
        });

    });
});