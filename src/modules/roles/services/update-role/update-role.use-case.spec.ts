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
        findById: jest.fn(),
        update: jest.fn(),
    };

    const fakeUuid = '084681ad-54c5-49bb-b2ec-a463d62ef9dd';

    const createRoleMock = (): Role => ({
        id: fakeUuid,
        name: 'Admin',
        description: 'Administrator role',
        isActive: true,
        version: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null
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
        
        it('should return bad request when id is not a valid UUID', async () => {
            const invalidId = 'invalid-uuid-123';

            const result = await service.execute(invalidId, dtoMock);

            expect(result.isSuccess).toBe(false);
            expect(result.errors[0]).toBe('Id should be a UUID');
            expect(roleRepository.findById).not.toHaveBeenCalled();
            expect(roleRepository.update).not.toHaveBeenCalled();
        });

        it('should return not found result when role does not exist', async () => {
            roleRepository.findById.mockResolvedValue(null);

            const result = await service.execute(fakeUuid, dtoMock);

            expect(result.isSuccess).toBe(false);
            expect(result.errors[0]).toBe('Role not found');
            expect(roleRepository.findById).toHaveBeenCalledWith(fakeUuid);
            expect(roleRepository.update).not.toHaveBeenCalled();
        });

        it('should successfully update a role (Happy Path)', async () => {
            const roleInstance = createRoleMock();
            roleRepository.findById.mockResolvedValue(roleInstance);

            const updatedRole = { ...roleInstance, ...dtoMock };
            roleRepository.update.mockResolvedValue(updatedRole);

            const result = await service.execute(fakeUuid, dtoMock);

            expect(result).toBeDefined();
            expect(result.isSuccess).toBe(true);
            expect(result.value).toEqual(updatedRole);

            expect(roleRepository.findById).toHaveBeenCalledWith(fakeUuid);
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
                roleRepository.findById.mockResolvedValue(roleInstance);
            });

            it('should return conflict result when role name is duplicated (23505 - uk_name_role via cause.constraint_name)', async () => {
                const dbError = {
                    cause: {
                        code: '23505',
                        constraint_name: 'uk_name_roles',
                        detail: 'Key (name)=(Super Admin) already exists.',
                    },
                };
                roleRepository.update.mockRejectedValue(dbError);

                const result = await service.execute(fakeUuid, dtoMock);

                expect(result.isSuccess).toBe(false);
                expect(result.errors[0]).toBe(`Name "${dtoMock.name}" already exists.`);
                expect(roleRepository.update).toHaveBeenCalledTimes(1);
            });

            it('should return conflict result when role name is duplicated (23505 - uk_name_role via detail)', async () => {
                const dbError = {
                    cause: {
                        code: '23505',
                        detail: 'Key (name)=(Super Admin) already exists. uk_name_role',
                    },
                };
                roleRepository.update.mockRejectedValue(dbError);

                const result = await service.execute(fakeUuid, dtoMock);

                expect(result.isSuccess).toBe(false);
                expect(result.errors[0]).toBe(`Name "${dtoMock.name}" already exists.`);
            });

            it('should return generic conflict result for unspecified unique constraint (23505)', async () => {
                const dbError = {
                    cause: {
                        code: '23505',
                        detail: 'Some other unique violation',
                    },
                };
                roleRepository.update.mockRejectedValue(dbError);

                const result = await service.execute(fakeUuid, dtoMock);

                expect(result.isSuccess).toBe(false);
                expect(result.errors[0]).toBe('Data conflict detected.');
            });

            it('should return bad request result on null violation (23502)', async () => {
                const dbError = {
                    cause: {
                        code: '23502',
                        column: 'name',
                    },
                };
                roleRepository.update.mockRejectedValue(dbError);

                const result = await service.execute(fakeUuid, dtoMock);

                expect(result.isSuccess).toBe(false);
                expect(result.errors[0]).toBe('The field "name" cannot be null.');
            });

            it('should handle missing column property on null violation gracefully (23502)', async () => {
                const dbError = {
                    cause: {
                        code: '23502',
                    },
                };
                roleRepository.update.mockRejectedValue(dbError);

                const result = await service.execute(fakeUuid, dtoMock);

                expect(result.errors[0]).toBe('The field "unknown field" cannot be null.');
            });

            it('should return bad request result when field size exceeds limit (22001)', async () => {
                const dbError = {
                    cause: {
                        code: '22001',
                    },
                };
                roleRepository.update.mockRejectedValue(dbError);

                const result = await service.execute(fakeUuid, dtoMock);

                expect(result.isSuccess).toBe(false);
                expect(result.errors[0]).toContain('exceed the maximum allowed length');
            });

            it('should throw InternalServerErrorException for unhandled database errors', async () => {
                const unknownError = new Error('Random database failure');
                roleRepository.update.mockRejectedValue(unknownError);

                await expect(service.execute(fakeUuid, dtoMock)).rejects.toThrow(InternalServerErrorException);
                await expect(service.execute(fakeUuid, dtoMock)).rejects.toThrow('Error updating role.');
                
                expect(roleRepository.update).toHaveBeenCalledTimes(2); 
            });
        });
    });
});