import { Test, TestingModule } from "@nestjs/testing";

import { IInboxRepository } from "../../repository/iinbox.repository";
import { UpdateInboxUseCase } from "./update-inbox.use-case.service";
import { InboxEntity } from "../../entities/inbox.entity";
import { InboxStatus } from "src/utils/enums/inbox-status.enum";
import { UpdateInboxDto } from "../../dto/update-inboox.dto";

describe("UpdateInboxUseCase ( UnitTest )", () => {

    let service: UpdateInboxUseCase;
    let repository: jest.Mocked<IInboxRepository>;

    const mockRepository = {
        findById: jest.fn(),
        update: jest.fn(),
    };

    const fakeInboxId = "550e8400-e29b-41d4-a716-446655440000";

    const fakeInbox: InboxEntity = {
        id: fakeInboxId,
        messageId: "650e8400-e29b-41d4-a716-446655440000",
        source: "payment-service",
        payload: JSON.stringify({
            paymentId: "payment-123",
            amount: 100,
        }),
        status: InboxStatus.PENDING,
        processedAt: new Date,
        version: 0,
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-01-01T00:00:00.000Z"),
        deletedAt: null
    };

    const fakeUpdatedInbox: InboxEntity = {
        ...fakeInbox,
        source: "payment-service-v2",
        status: InboxStatus.PROCESSED,
        processedAt: new Date("2026-01-01T01:00:00.000Z"),
        version: 1,
        updatedAt: new Date("2026-01-01T01:00:00.000Z"),
    };

    beforeEach(async () => {

        const module: TestingModule =
            await Test.createTestingModule({
                providers: [
                    UpdateInboxUseCase,
                    {
                        provide: IInboxRepository,
                        useValue: mockRepository,
                    },
                ],
            }).compile();

        service =
            module.get<UpdateInboxUseCase>(
                UpdateInboxUseCase,
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

        it("should successfully update an inbox message (Happy Path)", async () => {

            
            const processedAt =
                new Date("2026-01-01T01:00:00.000Z");

            const dto: UpdateInboxDto = {
                source: "payment-service-v2",
                status: InboxStatus.PROCESSED,
                processedAt,
            };

            const inbox = {
                ...fakeInbox,
            } as InboxEntity;

            repository.findById
                .mockResolvedValue(inbox);

            repository.update
                .mockResolvedValue(fakeUpdatedInbox);

            
            const result =
                await service.execute(
                    fakeInboxId,
                    dto,
                );

            
            expect(result).toBeDefined();
            expect(result.isSuccess).toBe(true);
            expect(result.value).toEqual(fakeUpdatedInbox);

            
            expect(
                repository.findById,
            ).toHaveBeenCalledTimes(1);

            expect(
                repository.findById,
            ).toHaveBeenCalledWith(
                fakeInboxId,
            );

            
            expect(
                repository.update,
            ).toHaveBeenCalledTimes(1);

            expect(
                repository.update,
            ).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: fakeInboxId,
                    source: "payment-service-v2",
                    status: InboxStatus.PROCESSED,
                    processedAt,
                }),
            );
        });

        it("should return bad request when id is not a valid UUID", async () => {

            
            const invalidId = "invalid-uuid";

            const dto: UpdateInboxDto = {
                status: InboxStatus.PROCESSED,
            };

            
            const result =
                await service.execute(
                    invalidId,
                    dto,
                );

            
            expect(result).toBeDefined();
            expect(result.isSuccess).toBe(false);
            expect(result.errors[0]).toBe(
                "Id should be UUID",
            );

            
            expect(
                repository.findById,
            ).not.toHaveBeenCalled();

            expect(
                repository.update,
            ).not.toHaveBeenCalled();
        });

        it("should return not found when inbox message does not exist", async () => {

            
            const dto: UpdateInboxDto = {
                status: InboxStatus.PROCESSED,
            };

            repository.findById
                .mockResolvedValue(null);

            
            const result =
                await service.execute(
                    fakeInboxId,
                    dto,
                );

            
            expect(result).toBeDefined();
            expect(result.isSuccess).toBe(false);
            expect(result.errors[0]).toBe(
                "Inbox message not found",
            );

            
            expect(
                repository.findById,
            ).toHaveBeenCalledTimes(1);

            expect(
                repository.findById,
            ).toHaveBeenCalledWith(
                fakeInboxId,
            );

            expect(
                repository.update,
            ).not.toHaveBeenCalled();
        });

        it("should update only the fields provided in the DTO", async () => {

            
            const dto: UpdateInboxDto = {
                status: InboxStatus.PROCESSED,
            };

            const inbox = {
                ...fakeInbox,
            } as InboxEntity;

            repository.findById
                .mockResolvedValue(inbox);

            repository.update
                .mockResolvedValue({
                    ...inbox,
                    status: InboxStatus.PROCESSED,
                });

            
            const result =
                await service.execute(
                    fakeInboxId,
                    dto,
                );

            
            expect(result.isSuccess).toBe(true);

            expect(
                repository.update,
            ).toHaveBeenCalledTimes(1);

            const updatedEntity =
                repository.update.mock.calls[0][0];

            expect(updatedEntity.status)
                .toBe(InboxStatus.PROCESSED);

            
            expect(updatedEntity.source)
                .toBe(fakeInbox.source);

            expect(updatedEntity.messageId)
                .toBe(fakeInbox.messageId);

            expect(updatedEntity.payload)
                .toBe(fakeInbox.payload);

            expect(updatedEntity.processedAt)
                .toBe(fakeInbox.processedAt);
        });

        it("should not overwrite fields when DTO contains undefined values", async () => {

            
            const dto: UpdateInboxDto = {
                source: undefined,
                status: InboxStatus.PROCESSED,
                processedAt: undefined,
            };

            const inbox = {
                ...fakeInbox,
            } as InboxEntity;

            repository.findById
                .mockResolvedValue(inbox);

            repository.update
                .mockResolvedValue({
                    ...inbox,
                    status: InboxStatus.PROCESSED,
                });

            
            await service.execute(
                fakeInboxId,
                dto,
            );

            
            const updatedEntity =
                repository.update.mock.calls[0][0];

            expect(updatedEntity.source)
                .toBe(fakeInbox.source);

            expect(updatedEntity.processedAt)
                .toBe(fakeInbox.processedAt);

            expect(updatedEntity.status)
                .toBe(InboxStatus.PROCESSED);
        });

        it("should successfully update only the source", async () => {

            
            const dto: UpdateInboxDto = {
                source: "new-payment-service",
            };

            const inbox = {
                ...fakeInbox,
            } as InboxEntity;

            repository.findById
                .mockResolvedValue(inbox);

            repository.update
                .mockResolvedValue({
                    ...inbox,
                    source: "new-payment-service",
                });

            
            const result =
                await service.execute(
                    fakeInboxId,
                    dto,
                );

            
            expect(result.isSuccess).toBe(true);

            const updatedEntity =
                repository.update.mock.calls[0][0];

            expect(updatedEntity.source)
                .toBe("new-payment-service");

            expect(updatedEntity.status)
                .toBe(fakeInbox.status);
        });

        it("should successfully update processedAt", async () => {

            
            const processedAt =
                new Date("2026-01-01T02:00:00.000Z");

            const dto: UpdateInboxDto = {
                processedAt,
            };

            const inbox = {
                ...fakeInbox,
            } as InboxEntity;

            repository.findById
                .mockResolvedValue(inbox);

            repository.update
                .mockResolvedValue({
                    ...inbox,
                    processedAt,
                });

            
            const result =
                await service.execute(
                    fakeInboxId,
                    dto,
                );

            
            expect(result.isSuccess).toBe(true);

            const updatedEntity =
                repository.update.mock.calls[0][0];

            expect(updatedEntity.processedAt)
                .toEqual(processedAt);
        });

        it("should propagate repository error when findById fails", async () => {

            
            const repositoryError =
                new Error("Database connection failed");

            repository.findById
                .mockRejectedValue(repositoryError);

            const dto: UpdateInboxDto = {
                status: InboxStatus.PROCESSED,
            };

            
            await expect(
                service.execute(
                    fakeInboxId,
                    dto,
                ),
            ).rejects.toThrow();

            
            expect(
                repository.findById,
            ).toHaveBeenCalledTimes(1);

            expect(
                repository.update,
            ).not.toHaveBeenCalled();
        });

        it("should handle PostgreSQL unique constraint violation", async () => {

            
            const postgresError = {
                code: "23505",
                constraint_name: "uk_inbox_message_id_source",
            };

            const inbox = {
                ...fakeInbox,
            } as InboxEntity;

            repository.findById
                .mockResolvedValue(inbox);

            repository.update
                .mockRejectedValue(postgresError);

            const dto: UpdateInboxDto = {
                source: "duplicated-source",
            };

            
            const result =
                await service.execute(
                    fakeInboxId,
                    dto,
                );

            
            expect(result.isSuccess).toBe(false);
            expect(result.status).toBe(409);

            expect(result.errors[0]).toBe(
                "uk_inbox_message_id_source",
            );

            
            expect(
                repository.update,
            ).toHaveBeenCalledTimes(1);
        });

        it("should handle PostgreSQL not-null violation", async () => {

            
            const postgresError = {
                code: "23502",
                column_name: "source",
            };

            const inbox = {
                ...fakeInbox,
            } as InboxEntity;

            repository.findById
                .mockResolvedValue(inbox);

            repository.update
                .mockRejectedValue(postgresError);

            const dto: UpdateInboxDto = {
                source: undefined,
            };

            
            const result =
                await service.execute(
                    fakeInboxId,
                    dto,
                );

            
            expect(result.isSuccess).toBe(false);
            expect(result.status).toBe(400);

            expect(result.errors[0]).toBe(
                "source",
            );
        });

        it("should handle PostgreSQL foreign key violation", async () => {

            
            const postgresError = {
                code: "23503",
                constraint_name: "fk_inbox_example",
            };

            const inbox = {
                ...fakeInbox,
            } as InboxEntity;

            repository.findById
                .mockResolvedValue(inbox);

            repository.update
                .mockRejectedValue(postgresError);

            const dto: UpdateInboxDto = {
                source: "external-service",
            };

            
            const result =
                await service.execute(
                    fakeInboxId,
                    dto,
                );

            
            expect(result.isSuccess).toBe(false);
            expect(result.status).toBe(409);

            expect(result.errors[0]).toBe(
                "fk_inbox_example",
            );
        });

        it("should handle PostgreSQL check constraint violation", async () => {

            
            const postgresError = {
                code: "23514",
                constraint_name: "ck_inbox_status",
            };

            const inbox = {
                ...fakeInbox,
            } as InboxEntity;

            repository.findById
                .mockResolvedValue(inbox);

            repository.update
                .mockRejectedValue(postgresError);

            const dto: UpdateInboxDto = {
                status: InboxStatus.PROCESSED,
            };

            
            const result =
                await service.execute(
                    fakeInboxId,
                    dto,
                );

            
            expect(result.isSuccess).toBe(false);
            expect(result.status).toBe(400);

            expect(result.errors[0]).toBe(
                "ck_inbox_status",
            );
        });

        it("should handle transaction conflict", async () => {

            
            const postgresError = {
                code: "40001",
            };

            const inbox = {
                ...fakeInbox,
            } as InboxEntity;

            repository.findById
                .mockResolvedValue(inbox);

            repository.update
                .mockRejectedValue(postgresError);

            const dto: UpdateInboxDto = {
                status: InboxStatus.PROCESSED,
            };

            
            const result =
                await service.execute(
                    fakeInboxId,
                    dto,
                );

            
            expect(result.isSuccess).toBe(false);
            expect(result.status).toBe(409);

            expect(result.errors[0]).toBe(
                "Transaction conflict, please retry",
            );
        });

        it("should handle deadlock", async () => {

            
            const postgresError = {
                code: "40P01",
            };

            const inbox = {
                ...fakeInbox,
            } as InboxEntity;

            repository.findById
                .mockResolvedValue(inbox);

            repository.update
                .mockRejectedValue(postgresError);

            const dto: UpdateInboxDto = {
                status: InboxStatus.PROCESSED,
            };

            
            const result =
                await service.execute(
                    fakeInboxId,
                    dto,
                );

            
            expect(result.isSuccess).toBe(false);
            expect(result.status).toBe(409);

            expect(result.errors[0]).toBe(
                "Deadlock detected, please retry",
            );
        });

        it("should handle invalid data format", async () => {

            
            const postgresError = {
                code: "22P02",
            };

            const inbox = {
                ...fakeInbox,
            } as InboxEntity;

            repository.findById
                .mockResolvedValue(inbox);

            repository.update
                .mockRejectedValue(postgresError);

            const dto: UpdateInboxDto = {
                status: InboxStatus.PROCESSED,
            };

            
            const result =
                await service.execute(
                    fakeInboxId,
                    dto,
                );

            
            expect(result.isSuccess).toBe(false);
            expect(result.status).toBe(400);

            expect(result.errors[0]).toBe(
                "Invalid data format",
            );
        });

        it("should handle value too long", async () => {

            
            const postgresError = {
                code: "22001",
            };

            const inbox = {
                ...fakeInbox,
            } as InboxEntity;

            repository.findById
                .mockResolvedValue(inbox);

            repository.update
                .mockRejectedValue(postgresError);

            const dto: UpdateInboxDto = {
                source: "a".repeat(1000),
            };

            
            const result =
                await service.execute(
                    fakeInboxId,
                    dto,
                );

            
            expect(result.isSuccess).toBe(false);
            expect(result.status).toBe(400);

            expect(result.errors[0]).toBe(
                "Value too long",
            );
        });

        it("should throw InternalServerErrorException for unhandled PostgreSQL error", async () => {

            
            const postgresError = {
                code: "99999",
            };

            const inbox = {
                ...fakeInbox,
            } as InboxEntity;

            repository.findById
                .mockResolvedValue(inbox);

            repository.update
                .mockRejectedValue(postgresError);

            const dto: UpdateInboxDto = {
                status: InboxStatus.PROCESSED,
            };

            
            await expect(
                service.execute(
                    fakeInboxId,
                    dto,
                ),
            ).rejects.toThrow();

            expect(
                repository.update,
            ).toHaveBeenCalledTimes(1);
        });

    });
});