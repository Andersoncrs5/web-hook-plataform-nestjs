import { Test, TestingModule } from '@nestjs/testing';
import { IInboxRepository } from '../../repository/iinbox.repository';
import { InboxEntity } from '../../entities/inbox.entity';
import { FindByMessageIdAndSourceUseCase } from './find-by-message-id-and-source.service';

describe('FindByMessageIdAndSourceUseCase ( UnitTest )', () => {
    let service: FindByMessageIdAndSourceUseCase;
    let inboxRepository: jest.Mocked<IInboxRepository>;

    const mockIInboxRepository = {
        findByMessageIdAndSource: jest.fn(),
    };

    const fakeMessageId = 'msg-1234';
    const fakeSource = 'rabbitmq-queue';

    const inboxMock: InboxEntity = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        messageId: fakeMessageId,
        source: fakeSource,
        payload: '{}',
        status: 'PENDING' as any,
        processedAt: null as any,
        version: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                FindByMessageIdAndSourceUseCase,
                {
                    provide: IInboxRepository,
                    useValue: mockIInboxRepository,
                },
            ],
        }).compile();

        service = module.get<FindByMessageIdAndSourceUseCase>(FindByMessageIdAndSourceUseCase);
        inboxRepository = module.get(IInboxRepository);
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined and dependencies correctly mocked', () => {
        expect(service).toBeDefined();
        expect(inboxRepository).toBeDefined();
    });

    describe('execute', () => {
        it('should successfully return an inbox item when messageId and source exist (Happy Path)', async () => {
            inboxRepository.findByMessageIdAndSource.mockResolvedValue(inboxMock);

            const result = await service.execute(fakeMessageId, fakeSource);

            expect(result).toBeDefined();
            expect(result.isSuccess).toBe(true);
            expect(result.value).toEqual(inboxMock);

            expect(inboxRepository.findByMessageIdAndSource).toHaveBeenCalledTimes(1);
            expect(inboxRepository.findByMessageIdAndSource).toHaveBeenCalledWith(fakeMessageId, fakeSource);
        });

        it('should return a not found result when inbox item does not exist (Sad Path)', async () => {
            inboxRepository.findByMessageIdAndSource.mockResolvedValue(null);

            const result = await service.execute(fakeMessageId, fakeSource);

            expect(result).toBeDefined();
            expect(result.isSuccess).toBe(false);
            expect(result.errors[0]).toBe('Inbox message not found');

            expect(inboxRepository.findByMessageIdAndSource).toHaveBeenCalledTimes(1);
            expect(inboxRepository.findByMessageIdAndSource).toHaveBeenCalledWith(fakeMessageId, fakeSource);
        });

        describe('Validation Rules (Sad Paths)', () => {
            it.each([
                ['null messageId', null, fakeSource, 'Message ID is required'],
                ['empty messageId', '', fakeSource, 'Message ID is required'],
                ['whitespace messageId', '   ', fakeSource, 'Message ID is required'],
                ['null source', fakeMessageId, null, 'Source is required'],
                ['empty source', fakeMessageId, '', 'Source is required'],
                ['whitespace source', fakeMessageId, '   ', 'Source is required'],
            ])('should return bad request when %s', async (_, messageId, source, expectedError) => {
                const result = await service.execute(messageId as any, source as any);

                expect(result.isSuccess).toBe(false);
                expect(result.errors[0]).toBe(expectedError);
                expect(inboxRepository.findByMessageIdAndSource).not.toHaveBeenCalled();
            });
        });

        describe('Database Errors / Exceptions', () => {
            it('should throw error when repository throws an unexpected error', async () => {
                const dbError = new Error('Database error');
                inboxRepository.findByMessageIdAndSource.mockRejectedValue(dbError);

                await expect(service.execute(fakeMessageId, fakeSource)).rejects.toThrow('Database error');

                expect(inboxRepository.findByMessageIdAndSource).toHaveBeenCalledTimes(1);
                expect(inboxRepository.findByMessageIdAndSource).toHaveBeenCalledWith(fakeMessageId, fakeSource);
            });
        });
    });
});