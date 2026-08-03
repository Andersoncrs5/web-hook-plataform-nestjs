import { Test, TestingModule } from '@nestjs/testing';
import { FindByIdRoleUseCase } from './find-by-id-role.use-case.service';
import { IRoleRepository } from '../../repository/iroles.repository';
import { Role } from '../../entities/role.entity';

describe('FindByIdRoleUseCase ( UnitTest )', () => {
    let service: FindByIdRoleUseCase;
    let roleRepository: jest.Mocked<IRoleRepository>;

    const mockIRoleRepository = {
        findById: jest.fn(),
    };

    const validUuid = '123e4567-e89b-12d3-a456-426614174000';
    
    const roleMock: Role = {
        id: validUuid,
        name: 'admin',
        description: null,
        isActive: false, 
        version: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                FindByIdRoleUseCase,
                {
                    provide: IRoleRepository,
                    useValue: mockIRoleRepository,
                },
            ],
        }).compile();

        service = module.get<FindByIdRoleUseCase>(FindByIdRoleUseCase);
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
        it('should successfully return a role when id exists (Happy Path)', async () => {
            roleRepository.findById.mockResolvedValue(roleMock);

            const result = await service.execute(validUuid);

            expect(result).toBeDefined();
            expect(result.isSuccess).toBe(true);
            expect(result.value).toEqual(roleMock);

            expect(roleRepository.findById).toHaveBeenCalledTimes(1);
            expect(roleRepository.findById).toHaveBeenCalledWith(validUuid);
        });

        describe('Validation Rules (Sad Paths)', () => {
            it('should return bad request when id is not a valid UUID', async () => {
                const result = await service.execute('invalid-uuid');

                expect(result.isSuccess).toBe(false);
                expect(result.errors[0]).toBe('Id should be a UUID');

                expect(roleRepository.findById).not.toHaveBeenCalled();
            });

            it('should return a not found result when role does not exist', async () => {
                roleRepository.findById.mockResolvedValue(null);

                const result = await service.execute(validUuid);

                expect(result).toBeDefined();
                expect(result.isSuccess).toBe(false);
                expect(result.errors[0]).toBe('Role not found');

                expect(roleRepository.findById).toHaveBeenCalledTimes(1);
                expect(roleRepository.findById).toHaveBeenCalledWith(validUuid);
            });
        });

        describe('Database Errors / Exceptions', () => {
            it('should throw error when repository throws an unexpected error', async () => {
                const dbError = new Error('Database error');
                roleRepository.findById.mockRejectedValue(dbError);

                await expect(service.execute(validUuid)).rejects.toThrow('Database error');

                expect(roleRepository.findById).toHaveBeenCalledTimes(1);
                expect(roleRepository.findById).toHaveBeenCalledWith(validUuid);
            });
        });
    });
});