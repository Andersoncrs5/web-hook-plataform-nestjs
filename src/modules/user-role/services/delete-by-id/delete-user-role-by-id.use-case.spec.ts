import { Test, TestingModule } from '@nestjs/testing';
import { IUserRoleRepository } from '../../repository/iuser-role.repository';
import { DeleteUserRoleByIdUseCase } from './delete-user-role-by-id.use-case.service';

describe('DeleteUserRoleByIdUseCase ( UnitTest )', () => {
    let service: DeleteUserRoleByIdUseCase;
    let userRoleRepository: jest.Mocked<IUserRoleRepository>;

    const mockIUserRoleRepository = {
        deleteById: jest.fn(),
    };

    const validUserRoleId = '123e4567-e89b-12d3-a456-426614174000';

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DeleteUserRoleByIdUseCase,
                {
                    provide: IUserRoleRepository,
                    useValue: mockIUserRoleRepository,
                },
            ],
        }).compile();

        service = module.get<DeleteUserRoleByIdUseCase>(DeleteUserRoleByIdUseCase);
        userRoleRepository = module.get(IUserRoleRepository);
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined and dependencies correctly mocked', () => {
        expect(service).toBeDefined();
        expect(userRoleRepository).toBeDefined();
    });

    describe('execute', () => {
        it('should successfully delete a user role when id exists (Happy Path)', async () => {
            userRoleRepository.deleteById.mockResolvedValue(true);

            const result = await service.execute(validUserRoleId);

            expect(result).toBeDefined();
            expect(result.isSuccess).toBe(true);
            
            expect(userRoleRepository.deleteById).toHaveBeenCalledTimes(1);
            expect(userRoleRepository.deleteById).toHaveBeenCalledWith(validUserRoleId);
        });

        it('should return a not found result when user role does not exist (Sad Path)', async () => {
            userRoleRepository.deleteById.mockResolvedValue(false);

            const result = await service.execute(validUserRoleId);

            expect(result).toBeDefined();
            expect(result.isSuccess).toBe(false);
            expect(result.errors[0]).toBe('User role not found'); 

            expect(userRoleRepository.deleteById).toHaveBeenCalledTimes(1);
            expect(userRoleRepository.deleteById).toHaveBeenCalledWith(validUserRoleId);
        });

        it('should return a bad request result when id is not a valid UUID (Sad Path)', async () => {
            const invalidId = 'invalid-uuid-format';

            const result = await service.execute(invalidId);

            expect(result).toBeDefined();
            expect(result.isSuccess).toBe(false);
            expect(result.errors[0]).toBe('Id should be a UUID');

            expect(userRoleRepository.deleteById).not.toHaveBeenCalled();
        });
    });
});