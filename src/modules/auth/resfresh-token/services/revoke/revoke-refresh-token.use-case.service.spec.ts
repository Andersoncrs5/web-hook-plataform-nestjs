import { Test, TestingModule } from '@nestjs/testing';
import { InternalServerErrorException } from '@nestjs/common';
import { RevokeRefreshTokenUseCase } from './revoke-refresh-token.use-case.service';
import { IRefreshTokenRepository } from '../../repository/irefresh-token.repository';
import { RefreshTokenEntity } from '../../entities/refresh-token.entity';
import { RefreshTokenStatus } from 'src/common/enums/refresh-token/refresh-token-status.enum';

describe('RevokeRefreshTokenUseCase ( UnitTest - Complete )', () => {
    let service: RevokeRefreshTokenUseCase;
    let repository: jest.Mocked<IRefreshTokenRepository>;

    const mockRepository = {
        findById: jest.fn(),
        update: jest.fn(),
    };

    const validUuid = '123e4567-e89b-12d3-a456-426614174000';

    const createBaseRefreshToken = (): RefreshTokenEntity => {
        return Object.assign(new RefreshTokenEntity(), {
            id: validUuid,
            userId: 'user-uuid-5678',
            tokenHash: 'some-token-hash-value',
            expiresAt: new Date(Date.now() + 86400000), 
            revokedAt: null,
            createdAt: new Date(),
            status: RefreshTokenStatus.ACTIVE,
            replacedByTokenId: null,
            version: 0,
            updatedAt: new Date(),
            deletedAt: null
        });
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                RevokeRefreshTokenUseCase,
                {
                    provide: IRefreshTokenRepository,
                    useValue: mockRepository,
                },
            ],
        }).compile();

        service = module.get<RevokeRefreshTokenUseCase>(RevokeRefreshTokenUseCase);
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
        it('should successfully revoke a refresh token and set revokedAt date (Happy Path)', async () => {
            const activeToken = createBaseRefreshToken();
            repository.findById.mockResolvedValue(activeToken);
            repository.update.mockImplementation(async (token) => token);

            const beforeExecution = Date.now();
            const result = await service.execute(validUuid);
            const afterExecution = Date.now();

            expect(result).toBeDefined();
            expect(result.isSuccess).toBe(true);
            expect(result.value).toBeInstanceOf(RefreshTokenEntity);

            if (!(result.value instanceof RefreshTokenEntity))
                throw new InternalServerErrorException()

            const revokedTime = result.value.revokedAt!.getTime();
            expect(revokedTime).toBeGreaterThanOrEqual(beforeExecution);
            expect(revokedTime).toBeLessThanOrEqual(afterExecution);

            expect(repository.findById).toHaveBeenCalledTimes(1);
            expect(repository.findById).toHaveBeenCalledWith(validUuid);
            expect(repository.update).toHaveBeenCalledTimes(1);
            expect(repository.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: validUuid,
                    revokedAt: expect.any(Date),
                }),
            );
        });

        describe('Validation Rules (Sad Paths)', () => {
            it('should return bad request when id is not a valid UUID', async () => {
                const result = await service.execute('not-a-uuid');

                expect(result.isSuccess).toBe(false);
                expect(result.errors).toContain('Id should be a UUID');

                expect(repository.findById).not.toHaveBeenCalled();
                expect(repository.update).not.toHaveBeenCalled();
            });

            it('should return not found when refresh token does not exist in database', async () => {
                repository.findById.mockResolvedValue(null);

                const result = await service.execute(validUuid);

                expect(result.isSuccess).toBe(false);
                expect(result.errors).toContain('Refresh token not found');

                expect(repository.findById).toHaveBeenCalledTimes(1);
                expect(repository.update).not.toHaveBeenCalled();
            });

            it('should return bad request when refresh token is already expired', async () => {
                const expiredToken = Object.assign(createBaseRefreshToken(), {
                    expiresAt: new Date(Date.now() - 5000), // Expirou há 5 segundos
                });
                repository.findById.mockResolvedValue(expiredToken);

                const result = await service.execute(validUuid);

                expect(result.isSuccess).toBe(false);
                expect(result.errors).toContain('Refresh token expired');

                expect(repository.update).not.toHaveBeenCalled();
            });

            it('should return bad request when refresh token is already revoked', async () => {
                const alreadyRevokedToken = Object.assign(createBaseRefreshToken(), {
                    revokedAt: new Date(Date.now() - 2000), // Já revogado
                });
                repository.findById.mockResolvedValue(alreadyRevokedToken);

                const result = await service.execute(validUuid);

                expect(result.isSuccess).toBe(false);
                expect(result.errors).toContain('Refresh token already revoked');

                expect(repository.update).not.toHaveBeenCalled();
            });
        });

        describe('Database Errors / Exceptions Handling (Sad Paths)', () => {
            it('should handle code 22001 and return bad request', async () => {
                repository.findById.mockResolvedValue(createBaseRefreshToken());
                repository.update.mockRejectedValue({ code: '22001' });

                const result = await service.execute(validUuid);

                expect(result.isSuccess).toBe(false);
                expect(result.errors[0]).toContain('exceed the maximum allowed length');
            });

            it('should handle code 23514 and return bad request', async () => {
                repository.findById.mockResolvedValue(createBaseRefreshToken());
                repository.update.mockRejectedValue({ code: '23514' });

                const result = await service.execute(validUuid);

                expect(result.isSuccess).toBe(false);
                expect(result.errors[0]).toBe('Refresh token data violates a database constraint.');
            });

            it('should handle code 22P02 and return bad request', async () => {
                repository.findById.mockResolvedValue(createBaseRefreshToken());
                repository.update.mockRejectedValue({ code: '22P02' });

                const result = await service.execute(validUuid);

                expect(result.isSuccess).toBe(false);
                expect(result.errors[0]).toBe('Invalid refresh token data.');
            });

            it('should throw InternalServerErrorException for unhandled database/system errors', async () => {
                repository.findById.mockResolvedValue(createBaseRefreshToken());
                repository.update.mockRejectedValue(new Error('Unexpected database down crash'));

                const execution = () => service.execute(validUuid);

                await expect(execution()).rejects.toThrow(InternalServerErrorException);
                
            });
        });
    });
});