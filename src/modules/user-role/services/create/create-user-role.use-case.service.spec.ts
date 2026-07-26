import { Test, TestingModule } from '@nestjs/testing';
import { IUserRoleRepository } from '../../repository/iuser-role.repository';
import { UserRole } from '../../entities/user-role.entity';
import { CreateUserRoleDto } from '../../dto/create-user-role.dto';
import { InternalServerErrorException } from '@nestjs/common';
import { CreateUserRoleService } from './create-user-role.use-case.service';

describe('CreateUserRoleService ( UnitTest )', () => {
    let service: CreateUserRoleService;
    let userRoleRepository: jest.Mocked<IUserRoleRepository>;

    const mockIUserRoleRepository = {
        create: jest.fn(),
    };

    const fakeId = 'user-role-uuid-1234';
    const fakeUserId = 'user-uuid-5678';
    const fakeRoleId = 'role-uuid-9012';

    const userRoleMock = {
        id: fakeId,
        userId: fakeUserId,
        roleId: fakeRoleId,
        version: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
    } as UserRole;

    const dtoMock: CreateUserRoleDto = {
        userId: fakeUserId,
        roleId: fakeRoleId,
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CreateUserRoleService, 
                {
                    provide: IUserRoleRepository,
                    useValue: mockIUserRoleRepository,
                },
            ],
        }).compile();

        service = module.get<CreateUserRoleService>(CreateUserRoleService);
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
        
        it('should successfully assign a role to a user (Happy Path)', async () => {
            userRoleRepository.create.mockResolvedValue(userRoleMock);

            const result = await service.execute(dtoMock);

            expect(result).toBeDefined();
            expect(result.isSuccess).toBe(true); 
            expect(result.value).toEqual(userRoleMock);

            expect(userRoleRepository.create).toHaveBeenCalledTimes(1);
            expect(userRoleRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    userId: dtoMock.userId,
                    roleId: dtoMock.roleId,
                })
            );
        });

        describe('Database Constraint Violations (Sad Paths)', () => {

            it('should return conflict result when assignment already exists (23505 - uk_user_roles_user_id_role_id)', async () => {
                const dbError = { code: '23505', detail: 'Key (user_id, role_id)=(...) already exists. uk_user_roles_user_id_role_id' };
                userRoleRepository.create.mockRejectedValue(dbError);

                const result = await service.execute(dtoMock);

                expect(result.isSuccess).toBe(false);
                expect(result.errors[0]).toBe('This user already has this role assigned.');
                expect(userRoleRepository.create).toHaveBeenCalledTimes(1);
            });

            it('should return generic conflict result for unspecified unique constraint (23505)', async () => {
                const dbError = { code: '23505', detail: 'Some other unique violation' };
                userRoleRepository.create.mockRejectedValue(dbError);

                const result = await service.execute(dtoMock);

                expect(result.isSuccess).toBe(false);
                expect(result.errors[0]).toBe('Data conflict detected.');
            });

            it('should return not found result when user_id does not exist (23503)', async () => {
                const dbError = { code: '23503', detail: 'Key (user_id)=(...) is not present in table "users".' };
                userRoleRepository.create.mockRejectedValue(dbError);

                const result = await service.execute(dtoMock);

                expect(result.isSuccess).toBe(false);
                expect(result.errors[0]).toBe('The specified User does not exist.');
            });

            it('should return not found result when role_id does not exist (23503)', async () => {
                const dbError = { code: '23503', detail: 'Key (role_id)=(...) is not present in table "roles".' };
                userRoleRepository.create.mockRejectedValue(dbError);

                const result = await service.execute(dtoMock);

                expect(result.isSuccess).toBe(false);
                expect(result.errors[0]).toBe('The specified Role does not exist.');
            });

            it('should return bad request result for generic foreign key violations (23503)', async () => {
                const dbError = { code: '23503', detail: 'Some other FK constraint' };
                userRoleRepository.create.mockRejectedValue(dbError);

                const result = await service.execute(dtoMock);

                expect(result.isSuccess).toBe(false);
                expect(result.errors[0]).toBe('Related record not found.');
            });

            it('should return bad request result on null violation (23502)', async () => {
                const dbError = { code: '23502', column: 'user_id' };
                userRoleRepository.create.mockRejectedValue(dbError);

                const result = await service.execute(dtoMock);

                expect(result.isSuccess).toBe(false);
                expect(result.errors[0]).toBe('The field "user_id" cannot be null.');
            });

            it('should handle missing column property on null violation gracefully (23502)', async () => {
                const dbError = { code: '23502' }; 
                userRoleRepository.create.mockRejectedValue(dbError);

                const result = await service.execute(dtoMock);

                expect(result.errors[0]).toBe('The field "unknown field" cannot be null.');
            });

            it('should return bad request result when field size exceeds limit (22001)', async () => {
                const dbError = { code: '22001' };
                userRoleRepository.create.mockRejectedValue(dbError);

                const result = await service.execute(dtoMock);

                expect(result.isSuccess).toBe(false);
                expect(result.errors[0]).toContain('exceed the maximum allowed length');
            });

            it('should throw InternalServerErrorException for unhandled database errors', async () => {
                const unknownError = new Error('Random database failure');
                userRoleRepository.create.mockRejectedValue(unknownError);
                
                await expect(service.execute(dtoMock)).rejects.toThrow(InternalServerErrorException);
                await expect(service.execute(dtoMock)).rejects.toThrow('Error assigning role to user.');
                
                expect(userRoleRepository.create).toHaveBeenCalledTimes(2); 
            });
        });
    });
});