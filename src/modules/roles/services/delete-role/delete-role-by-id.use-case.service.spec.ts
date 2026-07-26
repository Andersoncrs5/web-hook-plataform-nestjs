import { Test, TestingModule } from '@nestjs/testing';
import { IRoleRepository } from '../../repository/iroles.repository';
import { DeleteRoleByIdUseCase } from './delete-role-by-id.use-case.service';

describe('DeleteRoleByIdUseCase ( UnitTest )', () => {
    let service: DeleteRoleByIdUseCase;
    let roleRepository: jest.Mocked<IRoleRepository>;

    const mockIRoleRepository = {
        deleteById: jest.fn(),
    };

    const fakeRoleId = 'role-uuid-1234-5678';

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

            const result = await service.execute(fakeRoleId);

            expect(result).toBeDefined();
            expect(result.isSuccess).toBe(true);
            
            expect(roleRepository.deleteById).toHaveBeenCalledTimes(1);
            expect(roleRepository.deleteById).toHaveBeenCalledWith(fakeRoleId);
        });

        it('should return a not found result when role does not exist (Sad Path)', async () => {
            roleRepository.deleteById.mockResolvedValue(false);

            const result = await service.execute(fakeRoleId);

            expect(result).toBeDefined();
            expect(result.isSuccess).toBe(false);
            expect(result.errors[0]).toBe('Role not found'); 

            expect(roleRepository.deleteById).toHaveBeenCalledTimes(1);
            expect(roleRepository.deleteById).toHaveBeenCalledWith(fakeRoleId);
        });
    });
});