import { Test, TestingModule } from '@nestjs/testing';
import { UpdateRoleUseCase } from './update-role.use-case.service';
import { IRoleRepository } from '../../repository/iroles.repository';
import { Role } from '../../entities/role.entity';
import { UpdateRoleDto } from '../../dto/update-role.dto';
import { InternalServerErrorException } from '@nestjs/common';

describe('UpdateRoleUseCase ( UnitTest )', () => {
    let service: UpdateRoleUseCase;
    let roleRepository: jest.Mocked<IRoleRepository>;

    const mockIRoleRepository = {
        update: jest.fn(),
    };

    const fakeUuid = 'role-uuid-1234-5678';

    const createRoleMock = (): Role => ({
        id: fakeUuid,
        name: 'Admin',
        description: 'Administrator role',
        isActive: true,
        version: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
    });

    const dtoMock: UpdateRoleDto = {
        name: 'Super Admin',
        description: 'Elevated administrator',
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UpdateRoleUseCase, 
                {
                    provide: IRoleRepository,
                    useValue: mockIRoleRepository,
                },
            ],
        }).compile();

        service = module.get<UpdateRoleUseCase>(UpdateRoleUseCase);
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
        
        it('should successfully update a role (Happy Path)', async () => {
            const roleInstance = createRoleMock();
            
            // O repositório deve retornar a role atualizada
            roleRepository.update.mockResolvedValue({
                ...roleInstance,
                ...dtoMock,
            });

            const result = await service.execute(roleInstance, dtoMock);

            expect(result).toBeDefined();
            expect(result.isSuccess).toBe(true); 

            expect(roleRepository.update).toHaveBeenCalledTimes(1);
            expect(roleRepository.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: fakeUuid,
                    name: dtoMock.name,
                    description: dtoMock.description,
                })
            );
        });

        describe('Database Constraint Violations (Sad Paths)', () => {
            let roleInstance: Role;

            beforeEach(() => {
                roleInstance = createRoleMock();
            });

            it('should return conflict result when role name is duplicated (23505 - uk_name_role)', async () => {
                const dbError = { code: '23505', detail: 'Key (name)=(Super Admin) already exists. uk_name_role' };
                roleRepository.update.mockRejectedValue(dbError);

                const result = await service.execute(roleInstance, dtoMock);

                expect(result.isSuccess).toBe(false);
                expect(result.errors[0]).toBe(`Name "${dtoMock.name}" already exists.`);
                expect(roleRepository.update).toHaveBeenCalledTimes(1);
            });

            it('should return generic conflict result for unspecified unique constraint (23505)', async () => {
                const dbError = { code: '23505', detail: 'Some other unique violation' };
                roleRepository.update.mockRejectedValue(dbError);

                const result = await service.execute(roleInstance, dtoMock);

                expect(result.isSuccess).toBe(false);
                expect(result.errors[0]).toBe('Data conflict detected.');
            });

            it('should return bad request result on null violation (23502)', async () => {
                const dbError = { code: '23502', column: 'name' };
                roleRepository.update.mockRejectedValue(dbError);

                const result = await service.execute(roleInstance, dtoMock);

                expect(result.isSuccess).toBe(false);
                expect(result.errors[0]).toBe('The field "name" cannot be null.');
            });

            it('should handle missing column property on null violation gracefully (23502)', async () => {
                const dbError = { code: '23502' }; 
                roleRepository.update.mockRejectedValue(dbError);

                const result = await service.execute(roleInstance, dtoMock);

                expect(result.errors[0]).toBe('The field "unknown field" cannot be null.');
            });

            it('should return bad request result when field size exceeds limit (22001)', async () => {
                const dbError = { code: '22001' };
                roleRepository.update.mockRejectedValue(dbError);

                const result = await service.execute(roleInstance, dtoMock);

                expect(result.isSuccess).toBe(false);
                expect(result.errors[0]).toContain('exceed the maximum allowed length');
            });

            it('should throw InternalServerErrorException for unhandled database errors', async () => {
                const unknownError = new Error('Random database failure');
                roleRepository.update.mockRejectedValue(unknownError);

                await expect(service.execute(roleInstance, dtoMock)).rejects.toThrow(InternalServerErrorException);
                await expect(service.execute(roleInstance, dtoMock)).rejects.toThrow('Error updating role.');
                
                expect(roleRepository.update).toHaveBeenCalledTimes(2); 
            });
        });
    });
});