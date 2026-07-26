import { Test, TestingModule } from '@nestjs/testing';
import { ExistsByRoleIdAndUserIdUseCase } from './exists-by-role-id-user-id.use-case.service';
import { IUserRoleRepository } from '../../repository/iuser-role.repository';

describe('ExistsByRoleIdAndUserIdUseCase ( UnitTest )', () => {
    let service: ExistsByRoleIdAndUserIdUseCase;
    let userRoleRepository: jest.Mocked<IUserRoleRepository>;

    const mockIUserRoleRepository = {
        existsByRoleIdAndUserId: jest.fn(),
    };

    const validRoleId = '123e4567-e89b-12d3-a456-426614174000';
    const validUserId = '987f6543-e21a-34c5-b678-987654321000';

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ExistsByRoleIdAndUserIdUseCase,
                {
                    provide: IUserRoleRepository,
                    useValue: mockIUserRoleRepository,
                },
            ],
        }).compile();

        service = module.get<ExistsByRoleIdAndUserIdUseCase>(ExistsByRoleIdAndUserIdUseCase);
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
        
        it('should return Result.ok(true) when the relation exists (Happy Path)', async () => {
            userRoleRepository.existsByRoleIdAndUserId.mockResolvedValue(true);

            const result = await service.execute(validRoleId, validUserId);

            expect(result).toBeDefined();
            expect(result.isSuccess).toBe(true);
            expect(result.value).toBe(true);

            expect(userRoleRepository.existsByRoleIdAndUserId).toHaveBeenCalledTimes(1);
            expect(userRoleRepository.existsByRoleIdAndUserId).toHaveBeenCalledWith(validRoleId, validUserId);
        });

        it('should return Result.ok(false) when the relation does not exist', async () => {
            userRoleRepository.existsByRoleIdAndUserId.mockResolvedValue(false);

            const result = await service.execute(validRoleId, validUserId);

            expect(result).toBeDefined();
            expect(result.isSuccess).toBe(true);
            expect(result.value).toBe(false);

            expect(userRoleRepository.existsByRoleIdAndUserId).toHaveBeenCalledTimes(1);
        });

        describe('UUID Validation (Sad Paths)', () => {

            it('should return bad request when roleId is not a valid UUID', async () => {
                const invalidRoleId = 'invalid-role-uuid';

                const result = await service.execute(invalidRoleId, validUserId);

                expect(result.isSuccess).toBe(false);
                expect(result.errors[0]).toBe('RoleId should be a UUID');
                expect(userRoleRepository.existsByRoleIdAndUserId).not.toHaveBeenCalled();
            });

            it('should return bad request when userId is not a valid UUID', async () => {
                const invalidUserId = 'invalid-user-uuid';

                const result = await service.execute(validRoleId, invalidUserId);

                expect(result.isSuccess).toBe(false);
                expect(result.errors[0]).toBe('UserId should be a UUID');
                expect(userRoleRepository.existsByRoleIdAndUserId).not.toHaveBeenCalled();
            });

        });
    });
});