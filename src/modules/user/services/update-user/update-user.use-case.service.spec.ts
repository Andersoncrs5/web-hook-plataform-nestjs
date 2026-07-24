import { Test, TestingModule } from '@nestjs/testing';
import { UpdateUserUseCase } from './update-user.use-case.service';
import { IUserRepository } from '../../repository/iuser.repository';
import { PasswordService } from 'src/common/crypto/password.service';
import { User } from '../../entities/user.entity';
import { UpdateUserDto } from '../../dto/update-user.dto';
import { InternalServerErrorException } from '@nestjs/common';

describe('UpdateUserUseCase ( UnitTest )', () => {
    let service: UpdateUserUseCase;
    let userRepository: jest.Mocked<IUserRepository>;
    let passwordService: jest.Mocked<PasswordService>;

    const mockIUserRepository = {
        update: jest.fn(),
    };

    const mockPasswordService = {
        hash: jest.fn(),
    };

    const fakeUuid = 'default-uuid-1234-5678';
    const fakeHash = '$argon2id$v=19$m=65536,t=3,p=4$fakehash';
    const newFakeHash = '$argon2id$v=19$m=65536,t=3,p=4$newfakehash';

    const createUserMock = () => User.create({
        id: fakeUuid,
        name: 'John Doe',
        fullName: 'Johnathan Doe',
        email: 'johndoe@example.com',
        passwordHash: fakeHash,
    });

    const dtoMock: UpdateUserDto = {
        name: 'Jane Doe',
        fullName: 'Janeathan Doe',
        email: 'janedoe@example.com',
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UpdateUserUseCase, 
                {
                    provide: IUserRepository,
                    useValue: mockIUserRepository,
                },
                {
                    provide: PasswordService,
                    useValue: mockPasswordService,
                },
            ],
        }).compile();

        service = module.get<UpdateUserUseCase>(UpdateUserUseCase);
        userRepository = module.get(IUserRepository);
        passwordService = module.get(PasswordService);
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined and dependencies correctly mocked', () => {
        expect(service).toBeDefined();
        expect(userRepository).toBeDefined();
        expect(passwordService).toBeDefined();
    });

    describe('execute', () => {
        
        it('should successfully update a user without altering the password (Happy Path)', async () => {
            const userInstance = createUserMock();
            userRepository.update.mockResolvedValue(userInstance);

            const result = await service.execute(userInstance, dtoMock);

            expect(result).toBeDefined();
            expect(result.isSuccess).toBe(true); 
            expect(result.value).toEqual(userInstance);

            expect(passwordService.hash).not.toHaveBeenCalled();
            expect(userRepository.update).toHaveBeenCalledTimes(1);
            expect(userRepository.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: fakeUuid,
                    name: dtoMock.name,
                    email: dtoMock.email,
                    passwordHash: fakeHash, 
                })
            );
        });

        it('should hash the password and update the user when password is provided in DTO', async () => {
            const userInstance = createUserMock();
            const dtoWithPassword: UpdateUserDto = { ...dtoMock, password: 'newSecurePassword123' };
            
            passwordService.hash.mockResolvedValue(newFakeHash);
            userRepository.update.mockResolvedValue(userInstance);

            const result = await service.execute(userInstance, dtoWithPassword);

            expect(result.isSuccess).toBe(true);
            expect(passwordService.hash).toHaveBeenCalledTimes(1);
            expect(passwordService.hash).toHaveBeenCalledWith(dtoWithPassword.password);
            
            expect(userRepository.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    passwordHash: newFakeHash, 
                })
            );
        });

        describe('Database Constraint Violations (Sad Paths)', () => {
            let userInstance: User;

            beforeEach(() => {
                userInstance = createUserMock();
            });

            it('should return conflict result when username is duplicated (23505 - uk_name_user)', async () => {
                const dbError = { code: '23505', detail: 'Key (name)=(Jane Doe) already exists. uk_name_user' };
                userRepository.update.mockRejectedValue(dbError);

                const result = await service.execute(userInstance, dtoMock);

                expect(result.isSuccess).toBe(false);
                expect(result.errors[0]).toBe(`Name "${dtoMock.name}" already exists.`);
                expect(userRepository.update).toHaveBeenCalledTimes(1);
            });

            it('should return conflict result when email is duplicated (23505 - uk_email_user)', async () => {
                const dbError = { code: '23505', detail: 'Key (email)=(janedoe@example.com) already exists. uk_email_user' };
                userRepository.update.mockRejectedValue(dbError);

                const result = await service.execute(userInstance, dtoMock);

                expect(result.isSuccess).toBe(false);
                expect(result.errors[0]).toBe(`Email "${dtoMock.email}" already exists.`);
            });

            it('should return generic conflict result for unspecified unique constraint (23505)', async () => {
                const dbError = { code: '23505', detail: 'Some other unique violation' };
                userRepository.update.mockRejectedValue(dbError);

                const result = await service.execute(userInstance, dtoMock);

                expect(result.isSuccess).toBe(false);
                expect(result.errors[0]).toBe('Data conflict detected.');
            });

            it('should return bad request result on null violation (23502)', async () => {
                const dbError = { code: '23502', column: 'name' };
                userRepository.update.mockRejectedValue(dbError);

                const result = await service.execute(userInstance, dtoMock);

                expect(result.isSuccess).toBe(false);
                expect(result.errors[0]).toBe('The field "name" cannot be null.');
            });

            it('should handle missing column property on null violation gracefully (23502)', async () => {
                const dbError = { code: '23502' }; 
                userRepository.update.mockRejectedValue(dbError);

                const result = await service.execute(userInstance, dtoMock);

                expect(result.errors[0]).toBe('The field "unknown field" cannot be null.');
            });

            it('should return bad request result when field size exceeds limit (22001)', async () => {
                const dbError = { code: '22001' };
                userRepository.update.mockRejectedValue(dbError);

                const result = await service.execute(userInstance, dtoMock);

                expect(result.isSuccess).toBe(false);
                expect(result.errors[0]).toContain('exceed the maximum allowed length');
            });

            it('should throw InternalServerErrorException for unhandled database errors', async () => {
                const unknownError = new Error('Random database failure');
                userRepository.update.mockRejectedValue(unknownError);

                await expect(service.execute(userInstance, dtoMock)).rejects.toThrow(InternalServerErrorException);
                await expect(service.execute(userInstance, dtoMock)).rejects.toThrow('Error updating user.');
                
                expect(userRepository.update).toHaveBeenCalledTimes(2); 
            });
        });
    });
});