import { Test, TestingModule } from '@nestjs/testing';
import { IInboxRepository } from '../../repository/iinbox.repository';
import { DeleteInboxByIdUseCase } from './delete-inbox-by-id.use-case.service';

describe('DeleteInboxByIdUseCase ( UnitTest )', () => {
    let service: DeleteInboxByIdUseCase;
    let inboxRepository: jest.Mocked<IInboxRepository>;

    const mockIInboxRepository = {
        deleteById: jest.fn(),
    };

    const validUuid = '123e4567-e89b-12d3-a456-426614174000';

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DeleteInboxByIdUseCase,
                {
                    provide: IInboxRepository,
                    useValue: mockIInboxRepository,
                },
            ],
        }).compile();

        service = module.get<DeleteInboxByIdUseCase>(DeleteInboxByIdUseCase);
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
        it('should successfully delete an inbox item when id exists (Happy Path)', async () => {
            inboxRepository.deleteById.mockResolvedValue(true);

            const result = await service.execute(validUuid);

            expect(result).toBeDefined();
            expect(result.isSuccess).toBe(true);

            expect(inboxRepository.deleteById).toHaveBeenCalledTimes(1);
            expect(inboxRepository.deleteById).toHaveBeenCalledWith(validUuid);
        });

        describe('Validation Rules (Sad Paths)', () => {
            it('should return bad request when id is not a valid UUID', async () => {
                const result = await service.execute('invalid-uuid');

                expect(result.isSuccess).toBe(false);
                expect(result.errors[0]).toBe('Id should be a UUID');

                expect(inboxRepository.deleteById).not.toHaveBeenCalled();
            });

            it('should return a not found result when inbox item does not exist', async () => {
                inboxRepository.deleteById.mockResolvedValue(false);

                const result = await service.execute(validUuid);

                expect(result).toBeDefined();
                expect(result.isSuccess).toBe(false);
                expect(result.errors[0]).toBe('Role not found');

                expect(inboxRepository.deleteById).toHaveBeenCalledTimes(1);
                expect(inboxRepository.deleteById).toHaveBeenCalledWith(validUuid);
            });
        });

        describe('Database Errors / Exceptions', () => {
            it('should throw error when repository throws an unexpected error', async () => {
                const dbError = new Error('Database error');
                inboxRepository.deleteById.mockRejectedValue(dbError);

                await expect(service.execute(validUuid)).rejects.toThrow('Database error');

                expect(inboxRepository.deleteById).toHaveBeenCalledTimes(1);
                expect(inboxRepository.deleteById).toHaveBeenCalledWith(validUuid);
            });
        });
    });
});