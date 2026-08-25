import { Test, TestingModule } from '@nestjs/testing';
import { FindRoleByNameUseCase } from './find-role-by-name.use-case.service';
import { IRoleRepository } from '../../repository/iroles.repository';
import { Role } from '../../entities/role.entity';

describe('FindRoleByNameUseCase ( UnitTest )', () => {
    let service: FindRoleByNameUseCase;
    let roleRepository: jest.Mocked<IRoleRepository>;

    const mockRole: Role = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Admin',
        description: 'Administrator role',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
    } as Role;

    const mockIRoleRepository = {
        findByName: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                FindRoleByNameUseCase,
                {
                    provide: IRoleRepository,
                    useValue: mockIRoleRepository,
                },
            ],
        }).compile();

        service = module.get<FindRoleByNameUseCase>(FindRoleByNameUseCase);
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
        it('should return Result.ok(role) when the role exists (Happy Path)', async () => {
            const roleName = 'Admin';
            roleRepository.findByName.mockResolvedValue(mockRole);

            const result = await service.execute(roleName);

            expect(result).toBeDefined();
            expect(result.isSuccess).toBe(true);
            expect(result.value).toEqual(mockRole);

            expect(roleRepository.findByName).toHaveBeenCalledTimes(1);
            expect(roleRepository.findByName).toHaveBeenCalledWith(roleName);
        });

        it('should return Result.notFound("Role not found") when role does not exist', async () => {
            const roleName = 'NonExistentRole';
            roleRepository.findByName.mockResolvedValue(null);

            const result = await service.execute(roleName);

            expect(result).toBeDefined();
            expect(result.isSuccess).toBe(false);
            expect(result.errors[0]).toBe('Role not found');

            expect(roleRepository.findByName).toHaveBeenCalledTimes(1);
            expect(roleRepository.findByName).toHaveBeenCalledWith(roleName);
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

                expect(roleRepository.findByName).not.toHaveBeenCalled();
            });
        });

        describe('Database Errors / Exceptions', () => {
            it('should throw error when repository throws an unexpected error', async () => {
                const dbError = new Error('Database connection failed');
                roleRepository.findByName.mockRejectedValue(dbError);

                await expect(service.execute('Admin')).rejects.toThrow('Database connection failed');

                expect(roleRepository.findByName).toHaveBeenCalledTimes(1);
                expect(roleRepository.findByName).toHaveBeenCalledWith('Admin');
            });
        });
    });
});