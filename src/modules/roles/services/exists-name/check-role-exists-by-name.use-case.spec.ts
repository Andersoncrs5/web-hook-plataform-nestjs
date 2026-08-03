import { Test, TestingModule } from '@nestjs/testing';
import { CheckRoleExistsByNameUseCase } from './check-role-exists-by-name.use-case.service';
import { IRoleRepository } from '../../repository/iroles.repository';

describe('CheckRoleExistsByNameUseCase ( UnitTest )', () => {
    let service: CheckRoleExistsByNameUseCase;
    let roleRepository: jest.Mocked<IRoleRepository>;

    const mockIRoleRepository = {
        existsByName: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CheckRoleExistsByNameUseCase,
                {
                    provide: IRoleRepository,
                    useValue: mockIRoleRepository,
                },
            ],
        }).compile();

        service = module.get<CheckRoleExistsByNameUseCase>(CheckRoleExistsByNameUseCase);
        roleRepository = module.get(IRoleRepository);
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined and dependencies correctly mocked', () => {
        expect(service).toBeDefined();
        expect(roleRepository).toBeDefined();
    });

    describe('execute', () => {
        it('should return Result.ok(true) when the role name exists (Happy Path)', async () => {
            const roleName = 'Admin';
            roleRepository.existsByName.mockResolvedValue(true);

            const result = await service.execute(roleName);

            expect(result).toBeDefined();
            expect(result.isSuccess).toBe(true);
            expect(result.value).toBe(true);

            expect(roleRepository.existsByName).toHaveBeenCalledTimes(1);
            expect(roleRepository.existsByName).toHaveBeenCalledWith(roleName);
        });

        it('should return Result.ok(false) when the role name does not exist (Happy Path)', async () => {
            const roleName = 'UnknownRole';
            roleRepository.existsByName.mockResolvedValue(false);

            const result = await service.execute(roleName);

            expect(result).toBeDefined();
            expect(result.isSuccess).toBe(true);
            expect(result.value).toBe(false);

            expect(roleRepository.existsByName).toHaveBeenCalledTimes(1);
            expect(roleRepository.existsByName).toHaveBeenCalledWith(roleName);
        });

        describe('Validation Rules (Sad Paths)', () => {
            it.each([
                ['null', null as any],
                ['undefined', undefined as any],
                ['empty string', ''],
                ['whitespace only', '   '],
                ['non-string type', 123 as any],
            ])('should return bad request when name is %s', async (_, invalidName) => {
                const result = await service.execute(invalidName);

                expect(result.isSuccess).toBe(false);
                expect(result.errors[0]).toBe('Role name is required');

                expect(roleRepository.existsByName).not.toHaveBeenCalled();
            });
        });

        describe('Database Errors / Exceptions', () => {
            it('should throw error when repository throws an unexpected error', async () => {
                const dbError = new Error('Database error');
                roleRepository.existsByName.mockRejectedValue(dbError);

                await expect(service.execute('Admin')).rejects.toThrow('Database error');

                expect(roleRepository.existsByName).toHaveBeenCalledTimes(1);
                expect(roleRepository.existsByName).toHaveBeenCalledWith('Admin');
            });
        });
    });
});