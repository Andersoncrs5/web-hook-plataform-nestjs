import { Test, TestingModule } from '@nestjs/testing';
import { IUserRoleRepository } from '../../repository/iuser-role.repository';
import { FindUserRoleByUserIdJustRoleIdUseCase } from './find-by-user-id.use-case.service';

describe('FindUserRoleByUserIdUseCase ( UnitTest )', () => {
    let service: FindUserRoleByUserIdJustRoleIdUseCase;
    let repository: jest.Mocked<IUserRoleRepository>;

    const mockIUserRoleRepository = {
        findAllByUserIdJustRoleId: jest.fn(),
    };

    const validUuid = '123e4567-e89b-12d3-a456-426614174000';

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                FindUserRoleByUserIdJustRoleIdUseCase,
                {
                    provide: IUserRoleRepository,
                    useValue: mockIUserRoleRepository,
                },
            ],
        }).compile();

        service = module.get<FindUserRoleByUserIdJustRoleIdUseCase>(FindUserRoleByUserIdJustRoleIdUseCase);
        repository = module.get(IUserRoleRepository);
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined and dependencies correctly mocked', () => {
        expect(service).toBeDefined();
        expect(repository).toBeDefined();
    });

    describe('execute', () => {
        it('should return role ids when valid userId is provided (Happy Path)', async () => {
            const mockRoleIds = ['role-uuid-1', 'role-uuid-2'];
            repository.findAllByUserIdJustRoleId.mockResolvedValue(mockRoleIds);

            const result = await service.execute(validUuid);

            expect(result).toBeDefined();
            expect(result.isSuccess).toBe(true);
            expect(result.value).toEqual(mockRoleIds);

            expect(repository.findAllByUserIdJustRoleId).toHaveBeenCalledTimes(1);
            expect(repository.findAllByUserIdJustRoleId).toHaveBeenCalledWith(validUuid);
        });

        it('should return an empty array when user has no roles (Happy Path)', async () => {
            repository.findAllByUserIdJustRoleId.mockResolvedValue([]);

            const result = await service.execute(validUuid);

            expect(result).toBeDefined();
            expect(result.isSuccess).toBe(true);
            expect(result.value).toEqual([]);

            expect(repository.findAllByUserIdJustRoleId).toHaveBeenCalledTimes(1);
            expect(repository.findAllByUserIdJustRoleId).toHaveBeenCalledWith(validUuid);
        });

        describe('Validation Rules (Sad Paths)', () => {
            it('should return bad request when userId is not a valid UUID', async () => {
                const result = await service.execute('invalid-uuid');

                expect(result.isSuccess).toBe(false);
                expect(result.errors[0]).toBe('Id should be a UUID');

                expect(repository.findAllByUserIdJustRoleId).not.toHaveBeenCalled();
            });
        });

        describe('Database Errors / Exceptions', () => {
            it('should throw error when repository fails', async () => {
                const dbError = new Error('Database connection failure');
                repository.findAllByUserIdJustRoleId.mockRejectedValue(dbError);

                await expect(service.execute(validUuid)).rejects.toThrow('Database connection failure');

                expect(repository.findAllByUserIdJustRoleId).toHaveBeenCalledTimes(1);
                expect(repository.findAllByUserIdJustRoleId).toHaveBeenCalledWith(validUuid);
            });
        });
    });
});