import { Test, TestingModule } from "@nestjs/testing";

import { IInboxRepository } from "../../repository/iinbox.repository";
import { CryptoService } from "src/common/crypto/crypto.service";
import { CreateInboxDto } from "../../dto/create-inbox.dto";
import { InboxEntity } from "../../entities/inbox.entity";
import { InboxStatus } from "src/utils/enums/inbox-status.enum";
import { CreateInboxUseCase } from "./creare-inbox.use-case.service";

describe("CreateInboxUseCase ( UnitTest )", () => {
    let service: CreateInboxUseCase<any>;
    let repository: jest.Mocked<IInboxRepository>;
    let cryptoService: jest.Mocked<CryptoService>;

    const mockRepository = {
        create: jest.fn(),
    };

    const mockCryptoService = {
        generateUuid: jest.fn(),
    };

    const fakeUuid = "inbox-uuid-1234-5678";

    const payload = {
        orderId: "order-123",
        amount: 250,
        customer: {
            id: "customer-1",
            name: "John Doe",
        },
    };

    const dto: CreateInboxDto<typeof payload> = {
        messageId: "msg-123",
        source: "rabbitmq",
        payload,
    };

    const expectedInbox: InboxEntity = {
        id: fakeUuid,
        messageId: dto.messageId,
        source: dto.source,
        status: InboxStatus.PENDING,
        payload: JSON.stringify(payload),
    } as InboxEntity;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CreateInboxUseCase,
                {
                    provide: IInboxRepository,
                    useValue: mockRepository,
                },
                {
                    provide: CryptoService,
                    useValue: mockCryptoService,
                },
            ],
        }).compile();

        service = module.get<CreateInboxUseCase<any>>(CreateInboxUseCase);
        repository = module.get(IInboxRepository);
        cryptoService = module.get(CryptoService);
    });

    beforeEach(() => {
        jest.clearAllMocks();

        mockCryptoService.generateUuid.mockReturnValue(fakeUuid);
    });

    it("should be defined and dependencies correctly mocked", () => {
        expect(service).toBeDefined();
        expect(repository).toBeDefined();
        expect(cryptoService).toBeDefined();
    });

    describe("execute", () => {
        it("should successfully create an inbox record (Happy Path)", async () => {
            repository.create.mockResolvedValue(expectedInbox);

            const result = await service.execute(dto);

            expect(result).toBeDefined();
            expect(result.isSuccess).toBe(true);
            expect(result.value).toEqual(expectedInbox);

            expect(cryptoService.generateUuid).toHaveBeenCalledTimes(1);

            expect(repository.create).toHaveBeenCalledTimes(1);
            expect(repository.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: fakeUuid,
                    messageId: dto.messageId,
                    source: dto.source,
                    status: InboxStatus.PENDING,
                    payload: JSON.stringify(payload),
                }),
            );
        });

        it("should stringify payload before persisting", async () => {
            repository.create.mockResolvedValue(expectedInbox);

            await service.execute(dto);

            const createdArg = repository.create.mock.calls[0][0];

            expect(createdArg.payload).toBe(JSON.stringify(payload));
        });

        it("should return conflict when unique constraint is violated (23505)", async () => {
            repository.create.mockRejectedValue({
                code: "23505",
                constraint_name: "uk_inbox_message_id",
            });

            const result = await service.execute(dto);

            expect(result.isSuccess).toBe(false);
            expect(result.status).toBe(409);
            expect(result.errors[0]).toBe("uk_inbox_message_id");

            expect(repository.create).toHaveBeenCalledTimes(1);
        });

        it("should return bad request when not-null constraint is violated (23502)", async () => {
            repository.create.mockRejectedValue({
                code: "23502",
                column_name: "message_id",
            });

            const result = await service.execute(dto);

            expect(result.isSuccess).toBe(false);
            expect(result.status).toBe(400);
            expect(result.errors[0]).toBe("message_id");
        });

        it("should return conflict when foreign key constraint is violated (23503)", async () => {
            repository.create.mockRejectedValue({
                code: "23503",
                constraint_name: "fk_inbox_user",
            });

            const result = await service.execute(dto);

            expect(result.isSuccess).toBe(false);
            expect(result.status).toBe(409);
            expect(result.errors[0]).toBe("fk_inbox_user");
        });

        it("should return bad request when check constraint is violated (23514)", async () => {
            repository.create.mockRejectedValue({
                code: "23514",
                constraint_name: "ck_inbox_status",
            });

            const result = await service.execute(dto);

            expect(result.isSuccess).toBe(false);
            expect(result.status).toBe(400);
            expect(result.errors[0]).toBe("ck_inbox_status");
        });

        it("should return conflict for transaction conflicts (40001)", async () => {
            repository.create.mockRejectedValue({
                code: "40001",
            });

            const result = await service.execute(dto);

            expect(result.isSuccess).toBe(false);
            expect(result.status).toBe(409);
            expect(result.errors[0]).toBe("Transaction conflict, please retry");
        });

        it("should return conflict for deadlock errors (40P01)", async () => {
            repository.create.mockRejectedValue({
                code: "40P01",
            });

            const result = await service.execute(dto);

            expect(result.isSuccess).toBe(false);
            expect(result.status).toBe(409);
            expect(result.errors[0]).toBe("Deadlock detected, please retry");
        });

        it("should return forbidden for privilege errors (42501)", async () => {
            repository.create.mockRejectedValue({
                code: "42501",
            });

            const result = await service.execute(dto);

            expect(result.isSuccess).toBe(false);
            expect(result.status).toBe(403);
            expect(result.errors[0]).toBe("Insufficient database privileges");
        });

        it("should return bad request for invalid data format (22P02)", async () => {
            repository.create.mockRejectedValue({
                code: "22P02",
            });

            const result = await service.execute(dto);

            expect(result.isSuccess).toBe(false);
            expect(result.status).toBe(400);
            expect(result.errors[0]).toBe("Invalid data format");
        });

        it("should return bad request for too long values (22001)", async () => {
            repository.create.mockRejectedValue({
                code: "22001",
            });

            const result = await service.execute(dto);

            expect(result.isSuccess).toBe(false);
            expect(result.status).toBe(400);
            expect(result.errors[0]).toBe("Value too long");
        });

        it("should return bad request for numeric out of range (22003)", async () => {
            repository.create.mockRejectedValue({
                code: "22003",
            });

            const result = await service.execute(dto);

            expect(result.isSuccess).toBe(false);
            expect(result.status).toBe(400);
            expect(result.errors[0]).toBe("Numeric value out of range");
        });

        it("should throw InternalServerErrorException for unknown errors", async () => {
            repository.create.mockRejectedValue(
                new Error("Unexpected database failure"),
            );

            await expect(service.execute(dto)).rejects.toThrow(
                "Unexpected database failure",
            );
        });
    });
});