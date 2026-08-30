import { Test, TestingModule } from '@nestjs/testing';
import { CreateRoleUseCase } from './create-role.use-case.service';
import { IRoleRepository } from '../../repository/iroles.repository';
import { CryptoService } from 'src/common/crypto/crypto.service';
import { Role } from '../../entities/role.entity';
import { CreateRoleDto } from '../../dto/create-role.dto';
import { InternalServerErrorException } from '@nestjs/common';

describe('CreateRoleUseCase ( UnitTest )', () => {
    let service: CreateRoleUseCase;
    let roleRepository: jest.Mocked<IRoleRepository>;
    let cryptoService: jest.Mocked<CryptoService>;

    const mockIRoleRepository = {
        create: jest.fn(),
    };

    const mockCryptoService = {
        generateUuid: jest.fn(),
    };

    const fakeUuid = 'default-uuid-1234-5678';

    const roleMock: Role = {
        id: fakeUuid,
        name: 'admin',
        description: null,
        isActive: false,
        version: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
    };

    const dtoMock: CreateRoleDto = {
        name: roleMock.name,
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CreateRoleUseCase, 
                {
                    provide: IRoleRepository,
                    useValue: mockIRoleRepository,
                },
                {
                    provide: CryptoService,
                    useValue: mockCryptoService,
                },
            ],
        }).compile();

        service = module.get<CreateRoleUseCase>(CreateRoleUseCase);
        roleRepository = module.get(IRoleRepository);
        cryptoService = module.get(CryptoService);
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined and dependencies correctly mocked', () => {
        expect(service).toBeDefined();
        expect(roleRepository).toBeDefined();
        expect(cryptoService).toBeDefined();
    });

    describe('execute', () => {
        
        it('should successfully create a role (Happy Path)', async () => {
            cryptoService.generateUuid.mockReturnValue(fakeUuid);
            roleRepository.create.mockResolvedValue(roleMock);

            const result = await service.execute(dtoMock);

            expect(result).toBeDefined();
            expect(result.isSuccess).toBe(true); 
            expect(result.value).toEqual(roleMock);

            expect(cryptoService.generateUuid).toHaveBeenCalledTimes(1);

            expect(roleRepository.create).toHaveBeenCalledTimes(1);
            expect(roleRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: fakeUuid,
                    name: dtoMock.name,
                })
            );
        });

        describe('Database Constraint Violations (Sad Paths)', () => {
            
            beforeEach(() => {
                cryptoService.generateUuid.mockReturnValue(fakeUuid);
            });

            it('should return conflict result when role name is duplicated (23505 - uk_name_roles via cause.constraint_name)', async () => {
                const dbError = {
                    cause: {
                        code: '23505',
                        constraint_name: 'uk_name_roles',
                        detail: 'Key (name)=(admin) already exists.',
                    },
                };
                roleRepository.create.mockRejectedValue(dbError);

                const result = await service.execute(dtoMock);

                expect(result.isSuccess).toBe(false);
                expect(result.errors[0]).toBe(`Name "${dtoMock.name}" already exists.`);
                expect(roleRepository.create).toHaveBeenCalledTimes(1);
            });

            it('should return conflict result when role name is duplicated (23505 - uk_name_roles via cause.detail)', async () => {
                const dbError = {
                    cause: {
                        code: '23505',
                        detail: 'Key (name)=(admin) already exists. uk_name_roles',
                    },
                };
                roleRepository.create.mockRejectedValue(dbError);

                const result = await service.execute(dtoMock);

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
                roleRepository.create.mockRejectedValue(dbError);

                const result = await service.execute(dtoMock);

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
                roleRepository.create.mockRejectedValue(dbError);

                const result = await service.execute(dtoMock);

                expect(result.isSuccess).toBe(false);
                expect(result.errors[0]).toBe('The field "name" cannot be null.');
            });

            it('should handle missing column property on null violation gracefully (23502)', async () => {
                const dbError = {
                    cause: {
                        code: '23502',
                    },
                };
                roleRepository.create.mockRejectedValue(dbError);

                const result = await service.execute(dtoMock);

                expect(result.errors[0]).toBe('The field "unknown field" cannot be null.');
            });

            it('should return bad request result when field size exceeds limit (22001)', async () => {
                const dbError = {
                    cause: {
                        code: '22001',
                    },
                };
                roleRepository.create.mockRejectedValue(dbError);

                const result = await service.execute(dtoMock);

                expect(result.isSuccess).toBe(false);
                expect(result.errors[0]).toContain('exceed the maximum allowed length');
            });

            it('should throw InternalServerErrorException for unhandled database errors', async () => {
                const unknownError = new Error('Random database failure');
                roleRepository.create.mockRejectedValue(unknownError);
                
                await expect(service.execute(dtoMock)).rejects.toThrow(InternalServerErrorException);
                await expect(service.execute(dtoMock)).rejects.toThrow('Error creating role.');
                
                expect(roleRepository.create).toHaveBeenCalledTimes(2); 
            });
        });
    });
});