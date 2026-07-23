import { Test, TestingModule } from '@nestjs/testing';
import { CreateUserUseCase } from './create-user.use-case.service';
import { IUserRepository } from '../../repository/iuser.repository';
import { PasswordService } from 'src/common/crypto/password.service';
import { CryptoService } from 'src/common/crypto/crypto.service';
import { User } from '../../entities/user.entity';
import { CreateUserDto } from '../../dto/create-user.dto';
import { InternalServerErrorException } from '@nestjs/common';

describe('CreateUserUseCase ( UnitTest )', () => {
    let service: CreateUserUseCase;
    let userRepository: jest.Mocked<IUserRepository>;
    let passwordService: jest.Mocked<PasswordService>;
    let cryptoService: jest.Mocked<CryptoService>;

    const mockIUserRepository = {
        create: jest.fn(),
    };

    const mockPasswordService = {
        hash: jest.fn(),
    };

    const mockCryptoService = {
        generateUuid: jest.fn(),
    };

    
    const fakeUuid = 'default-uuid-1234-5678';
    const fakeHash = '$argon2id$v=19$m=65536,t=3,p=4$fakehash';

    const userMock = User.create({
        id: fakeUuid,
        name: 'John Doe',
        fullName: 'Johnathan Doe',
        email: 'johndoe@example.com',
        passwordHash: fakeHash,
    });

    const dtoMock: CreateUserDto = {
        name: userMock.name,
        fullName: userMock.fullName,
        email: userMock.email,
        password: 'securePassword123',
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CreateUserUseCase, 
                {
                    provide: IUserRepository,
                    useValue: mockIUserRepository,
                },
                {
                    provide: PasswordService,
                    useValue: mockPasswordService,
                },
                {
                    provide: CryptoService,
                    useValue: mockCryptoService,
                },
            ],
        }).compile();

        service = module.get<CreateUserUseCase>(CreateUserUseCase);
        userRepository = module.get(IUserRepository);
        passwordService = module.get(PasswordService);
        cryptoService = module.get(CryptoService);
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined and dependencies correctly mocked', () => {
        expect(service).toBeDefined();
        expect(userRepository).toBeDefined();
        expect(passwordService).toBeDefined();
        expect(cryptoService).toBeDefined();
    });

    describe('execute', () => {
        
        it('should successfully create a user (Happy Path)', async () => {
            
            passwordService.hash.mockResolvedValue(fakeHash);
            cryptoService.generateUuid.mockReturnValue(fakeUuid);
            userRepository.create.mockResolvedValue(userMock);

            const result = await service.execute(dtoMock);

            expect(result).toBeDefined();
            expect(result.isSuccess).toBe(true); 
            expect(result.value).toEqual(userMock);

            
            expect(passwordService.hash).toHaveBeenCalledTimes(1);
            expect(passwordService.hash).toHaveBeenCalledWith(dtoMock.password);

            expect(cryptoService.generateUuid).toHaveBeenCalledTimes(1);

            expect(userRepository.create).toHaveBeenCalledTimes(1);
            
            expect(userRepository.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: fakeUuid,
                    name: dtoMock.name,
                    email: dtoMock.email,
                    passwordHash: fakeHash,
                })
            );
        });

        describe('Database Constraint Violations (Sad Paths)', () => {
            
            beforeEach(() => {
                passwordService.hash.mockResolvedValue(fakeHash);
                cryptoService.generateUuid.mockReturnValue(fakeUuid);
            });

            it('should return conflict result when username is duplicated (23505 - uk_name_user)', async () => {
                const dbError = { code: '23505', detail: 'Key (name)=(John Doe) already exists. uk_name_user' };
                userRepository.create.mockRejectedValue(dbError);

                const result = await service.execute(dtoMock);

                expect(result.isSuccess).toBe(false);
                expect(result.errors[0]).toBe(`Name "${dtoMock.name}" already exists.`);
                expect(userRepository.create).toHaveBeenCalledTimes(1);
            });

            it('should return conflict result when email is duplicated (23505 - uk_email_user)', async () => {
                const dbError = { code: '23505', detail: 'Key (email)=(johndoe@example.com) already exists. uk_email_user' };
                userRepository.create.mockRejectedValue(dbError);

                const result = await service.execute(dtoMock);

                expect(result.isSuccess).toBe(false);
                expect(result.errors[0]).toBe(`Email "${dtoMock.email}" already exists.`);
            });

            it('should return generic conflict result for unspecified unique constraint (23505)', async () => {
                const dbError = { code: '23505', detail: 'Some other unique violation' };
                userRepository.create.mockRejectedValue(dbError);

                const result = await service.execute(dtoMock);

                expect(result.isSuccess).toBe(false);
                expect(result.errors[0]).toBe('Data conflict detected.');
            });

            it('should return bad request result on null violation (23502)', async () => {
                const dbError = { code: '23502', column: 'password_hash' };
                userRepository.create.mockRejectedValue(dbError);

                const result = await service.execute(dtoMock);

                expect(result.isSuccess).toBe(false);
                expect(result.errors[0]).toBe('The field "password_hash" cannot be null.');
            });

            it('should handle missing column property on null violation gracefully (23502)', async () => {
                const dbError = { code: '23502' }; 
                userRepository.create.mockRejectedValue(dbError);

                const result = await service.execute(dtoMock);

                expect(result.errors[0]).toBe('The field "unknown field" cannot be null.');
            });

            it('should return bad request result when field size exceeds limit (22001)', async () => {
                const dbError = { code: '22001' };
                userRepository.create.mockRejectedValue(dbError);

                const result = await service.execute(dtoMock);

                expect(result.isSuccess).toBe(false);
                expect(result.errors[0]).toContain('exceed the maximum allowed length');
            });

            it('should throw InternalServerErrorException for unhandled database errors', async () => {
                const unknownError = new Error('Random database failure');
                userRepository.create.mockRejectedValue(unknownError);

                
                await expect(service.execute(dtoMock)).rejects.toThrow(InternalServerErrorException);
                await expect(service.execute(dtoMock)).rejects.toThrow('Error creating user.');
                
                expect(userRepository.create).toHaveBeenCalledTimes(2); 
            });
        });
    });
});