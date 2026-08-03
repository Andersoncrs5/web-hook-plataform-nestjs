import { Test, TestingModule } from '@nestjs/testing';
import { IRoleRepository } from '../../repository/iroles.repository';
import { DeleteRoleByIdUseCase } from './delete-role-by-id.use-case.service';

describe('DeleteRoleByIdUseCase ( UnitTest )', () => {
    let service: DeleteRoleByIdUseCase;
    let roleRepository: jest.Mocked<IRoleRepository>;

    const mockIRoleRepository = {
        deleteById: jest.fn(),
    };

    const validUuid = '123e4567-e89b-12d3-a456-426614174000';

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DeleteRoleByIdUseCase,
                {
                    provide: IRoleRepository,
                    useValue: mockIRoleRepository,
                },
            ],
        }).compile();

        service = module.get<DeleteRoleByIdUseCase>(DeleteRoleByIdUseCase);
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
        it('should successfully delete a role when id exists (Happy Path)', async () => {
            roleRepository.deleteById.mockResolvedValue(true);

            const result = await service.execute(validUuid);

            expect(result).toBeDefined();
            expect(result.isSuccess).toBe(true);

            expect(roleRepository.deleteById).toHaveBeenCalledTimes(1);
            expect(roleRepository.deleteById).toHaveBeenCalledWith(validUuid);
        });

        describe('Validation Rules (Sad Paths)', () => {
            it('should return bad request when id is not a valid UUID', async () => {
                const result = await service.execute('invalid-uuid');

                expect(result.isSuccess).toBe(false);
                expect(result.errors[0]).toBe('Id should be a UUID');

                expect(roleRepository.deleteById).not.toHaveBeenCalled();
            });

            it('should return a not found result when role does not exist', async () => {
                roleRepository.deleteById.mockResolvedValue(false);

                const result = await service.execute(validUuid);

                expect(result).toBeDefined();
                expect(result.isSuccess).toBe(false);
                expect(result.errors[0]).toBe('Role not found');

                expect(roleRepository.deleteById).toHaveBeenCalledTimes(1);
                expect(roleRepository.deleteById).toHaveBeenCalledWith(validUuid);
            });
        });

        describe('Database Errors / Exceptions', () => {
            it('should throw error when repository throws an unexpected error', async () => {
                const dbError = new Error('Database error');
                roleRepository.deleteById.mockRejectedValue(dbError);

                await expect(service.execute(validUuid)).rejects.toThrow('Database error');

                expect(roleRepository.deleteById).toHaveBeenCalledTimes(1);
                expect(roleRepository.deleteById).toHaveBeenCalledWith(validUuid);
            });
        });
    });
});