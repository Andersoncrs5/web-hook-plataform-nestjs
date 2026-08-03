import { Test, TestingModule } from '@nestjs/testing';
import { DeleteRefreshTokenById } from './delete-refresh-token-by-id.use-case.service';
import { IRefreshTokenRepository } from '../../repository/irefresh-token.repository';

describe('DeleteRefreshTokenById ( UnitTest )', () => {
    let service: DeleteRefreshTokenById;
    let repository: jest.Mocked<IRefreshTokenRepository>;

    const mockRepository = {
        deleteByIdAndCount: jest.fn(),
    };

    const validUuid = '123e4567-e89b-12d3-a456-426614174000';

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DeleteRefreshTokenById,
                {
                    provide: IRefreshTokenRepository,
                    useValue: mockRepository,
                },
            ],
        }).compile();

        service = module.get<DeleteRefreshTokenById>(DeleteRefreshTokenById);
        repository = module.get(IRefreshTokenRepository);
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined and dependencies correctly mocked', () => {
        expect(service).toBeDefined();
        expect(repository).toBeDefined();
    });

    describe('execute', () => {
        it('should successfully delete a refresh token when id exists (Happy Path)', async () => {
            
            repository.deleteByIdAndCount.mockResolvedValue(1); 
            
            const result = await service.execute(validUuid);

            expect(result).toBeDefined();
            expect(result.isSuccess).toBe(true);

            
            expect(repository.deleteByIdAndCount).toHaveBeenCalledTimes(1);
            expect(repository.deleteByIdAndCount).toHaveBeenCalledWith(validUuid);
        });

        it('should return a not found result when refresh token does not exist (Sad Path)', async () => {
            
            repository.deleteByIdAndCount.mockResolvedValue(0); 
            
            const result = await service.execute(validUuid);

            expect(result).toBeDefined();
            expect(result.isSuccess).toBe(false);
            expect(result.errors[0]).toBe('Refresh token not found');

            
            expect(repository.deleteByIdAndCount).toHaveBeenCalledTimes(1);
            expect(repository.deleteByIdAndCount).toHaveBeenCalledWith(validUuid);
        });

        it('should return a bad request result when id is not a valid UUID (Sad Path)', async () => {
            
            const invalidId = 'invalid-uuid-format';

            
            const result = await service.execute(invalidId);

            
            expect(result).toBeDefined();
            expect(result.isSuccess).toBe(false);
            expect(result.errors[0]).toBe('Id should be a UUID');

            
            expect(repository.deleteByIdAndCount).not.toHaveBeenCalled();
        });
    });
});