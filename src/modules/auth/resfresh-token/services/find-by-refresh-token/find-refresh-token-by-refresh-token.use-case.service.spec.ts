import { Test, TestingModule } from '@nestjs/testing';
import { InternalServerErrorException } from '@nestjs/common';
import { FindByRefreshTokenUseCase } from './find-refresh-token-by-refresh-token.use-case.service';
import { IRefreshTokenRepository } from '../../repository/irefresh-token.repository';
import { RefreshTokenEntity } from '../../entities/refresh-token.entity';
import { RefreshTokenStatus } from 'src/common/enums/refresh-token/refresh-token-status.enum';

describe('FindByRefreshTokenUseCase ( UnitTest )', () => {
    let service: FindByRefreshTokenUseCase;
    let repository: jest.Mocked<IRefreshTokenRepository>;

    const mockRepository = {
        findByTokenHash: jest.fn(),
    };

    const fakeTokenHash = 'some-token-hash-string';
    
    const fakeRefreshToken: RefreshTokenEntity = {
        id: 'token-uuid-1234',
        userId: 'user-uuid-5678',
        tokenHash: fakeTokenHash,
        expiresAt: new Date(Date.now() + 86400000),
        createdAt: new Date(),
        status: RefreshTokenStatus.ACTIVE,
        revokedAt: null,
        replacedByTokenId: null,
        version: 0,
        updatedAt: new Date(),
        deletedAt: null
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                FindByRefreshTokenUseCase,
                {
                    provide: IRefreshTokenRepository,
                    useValue: mockRepository,
                },
            ],
        }).compile();

        service = module.get<FindByRefreshTokenUseCase>(FindByRefreshTokenUseCase);
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
        it('should successfully return the refresh token entity when found (Happy Path)', async () => {
            // Arrange
            repository.findByTokenHash.mockResolvedValue(fakeRefreshToken);

            // Act
            const result = await service.execute(fakeTokenHash);

            // Assert
            expect(result).toBeDefined();
            expect(result.isSuccess).toBe(true);
            expect(result.value).toEqual(fakeRefreshToken);

            // Verify
            expect(repository.findByTokenHash).toHaveBeenCalledTimes(1);
            expect(repository.findByTokenHash).toHaveBeenCalledWith(fakeTokenHash);
        });

        it('should return not found result when refresh token does not exist (Sad Path)', async () => {
            // Arrange
            repository.findByTokenHash.mockResolvedValue(null);

            // Act
            const result = await service.execute(fakeTokenHash);

            // Assert
            expect(result).toBeDefined();
            expect(result.isSuccess).toBe(false);
            expect(result.errors[0]).toBe('Refresh token not found');

            // Verify
            expect(repository.findByTokenHash).toHaveBeenCalledTimes(1);
            expect(repository.findByTokenHash).toHaveBeenCalledWith(fakeTokenHash);
        });

        it('should throw InternalServerErrorException when repository throws an error', async () => {
            // Arrange
            const dbError = new Error('Database connection failed');
            repository.findByTokenHash.mockRejectedValue(dbError);

            // Act & Assert
            await expect(service.execute(fakeTokenHash)).rejects.toThrow(
                InternalServerErrorException,
            );

            await expect(service.execute(fakeTokenHash)).rejects.toThrow(
                'An unexpected error occurred while finding the refresh token.',
            );

            // Verify
            expect(repository.findByTokenHash).toHaveBeenCalledTimes(2);
        });
    });
});