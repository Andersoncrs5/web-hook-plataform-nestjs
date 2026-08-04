import { Test, TestingModule } from '@nestjs/testing';
import { RegisterUserService } from './register-user.use-case.service';
import { CreateUserUseCase } from 'src/modules/user/services/create-user/create-user.use-case.service';
import { CreateTokensUseCase } from '../create-token/create-token.use-case.service';
import { FindUserRoleByUserIdJustRoleIdUseCase } from 'src/modules/user-role/services/find-by-user-id/find-by-user-id.use-case.service';
import { FindRoleByIds } from 'src/modules/roles/services/find-role-by-ids/find-role-by-ids.use-case.service';
import { User } from 'src/modules/user/entities/user.entity';
import { Tokens } from '../../classes/token.class';
import { Role } from 'src/modules/roles/entities/role.entity';
import { Result } from 'src/common/result/result';
import { CreateUserDto } from 'src/modules/user/dto/create-user.dto';
import { HttpStatus } from '@nestjs/common';

describe('RegisterUser ( UnitTest )', () => {
    let service: RegisterUserService;
    let createUser: jest.Mocked<CreateUserUseCase>;
    let createTokens: jest.Mocked<CreateTokensUseCase>;
    let findUserRoleByUserIdJustRoleId: jest.Mocked<FindUserRoleByUserIdJustRoleIdUseCase>;
    let findRolesById: jest.Mocked<FindRoleByIds>;

    const mockCreateUser = { execute: jest.fn() };
    const mockCreateTokens = { execute: jest.fn() };
    const mockFindUserRoleByUserIdJustRoleId = { execute: jest.fn() };
    const mockFindRolesById = { execute: jest.fn() };

    const fakeDto: CreateUserDto = {
        email: 'test@example.com',
        password: 'Password123!',
        name: 'Test User',
    } as any;

    const fakeUser = { id: '123e4567-e89b-12d3-a456-426614174000', email: 'test@example.com' } as User;
    const fakeTokens = { token: 'access', refreshToken: 'refresh' } as Tokens;
    const fakeRoleId = '987fc532-e89b-12d3-a456-426614174000';
    const fakeRole = { id: fakeRoleId, name: 'admin' } as Role;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                RegisterUserService,
                { provide: CreateUserUseCase, useValue: mockCreateUser },
                { provide: CreateTokensUseCase, useValue: mockCreateTokens },
                { provide: FindUserRoleByUserIdJustRoleIdUseCase, useValue: mockFindUserRoleByUserIdJustRoleId },
                { provide: FindRoleByIds, useValue: mockFindRolesById },
            ],
        }).compile();

        service = module.get<RegisterUserService>(RegisterUserService);
        createUser = module.get(CreateUserUseCase);
        createTokens = module.get(CreateTokensUseCase);
        findUserRoleByUserIdJustRoleId = module.get(FindUserRoleByUserIdJustRoleIdUseCase);
        findRolesById = module.get(FindRoleByIds);
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined and dependencies correctly mocked', () => {
        expect(service).toBeDefined();
    });

    describe('execute', () => {
        it('should register user and return tokens when user has roles (Happy Path)', async () => {
            createUser.execute.mockResolvedValue(Result.ok(fakeUser));
            findUserRoleByUserIdJustRoleId.execute.mockResolvedValue(Result.ok([fakeRoleId]));
            findRolesById.execute.mockResolvedValue(Result.ok([fakeRole]));
            createTokens.execute.mockResolvedValue(Result.ok(fakeTokens));

            const result = await service.execute(fakeDto);

            expect(result.isSuccess).toBe(true);
            expect(result.value).toEqual(fakeTokens);

            expect(createUser.execute).toHaveBeenCalledWith(fakeDto);
            expect(findUserRoleByUserIdJustRoleId.execute).toHaveBeenCalledWith(fakeUser.id);
            expect(findRolesById.execute).toHaveBeenCalledWith([fakeRoleId]);
            expect(createTokens.execute).toHaveBeenCalledWith(fakeUser, ['admin']);
        });

        it('should register user and return tokens without querying roles if user has no roleIds', async () => {
            createUser.execute.mockResolvedValue(Result.ok(fakeUser));
            findUserRoleByUserIdJustRoleId.execute.mockResolvedValue(Result.ok([]));
            createTokens.execute.mockResolvedValue(Result.ok(fakeTokens));

            const result = await service.execute(fakeDto);

            expect(result.isSuccess).toBe(true);
            expect(result.value).toEqual(fakeTokens);

            expect(findRolesById.execute).not.toHaveBeenCalled();
            expect(createTokens.execute).toHaveBeenCalledWith(fakeUser, []);
        });

        describe('Sad Paths', () => {
            it('should return failure if createUser fails', async () => {
                createUser.execute.mockResolvedValue(Result.badRequest('Email already exists'));

                const result = await service.execute(fakeDto);

                expect(result.isSuccess).toBe(false);
                expect(result.errors[0]).toBe('Email already exists');
                expect(findUserRoleByUserIdJustRoleId.execute).not.toHaveBeenCalled();
            });

            it('should return failure if findUserRoleByUserIdJustRoleId fails', async () => {
                createUser.execute.mockResolvedValue(Result.ok(fakeUser));
                findUserRoleByUserIdJustRoleId.execute.mockResolvedValue(Result.badRequest('Invalid User ID'));

                const result = await service.execute(fakeDto);

                expect(result.isSuccess).toBe(false);
                expect(result.errors[0]).toBe('Invalid User ID');
                expect(findRolesById.execute).not.toHaveBeenCalled();
            });

            it('should return failure if findRolesById fails', async () => {
                createUser.execute.mockResolvedValue(Result.ok(fakeUser));
                findUserRoleByUserIdJustRoleId.execute.mockResolvedValue(Result.ok([fakeRoleId]));
                findRolesById.execute.mockResolvedValue(Result.failure(['Role error'], HttpStatus.INTERNAL_SERVER_ERROR));

                const result = await service.execute(fakeDto);

                expect(result.isSuccess).toBe(false);
                expect(result.errors[0]).toBe('Role error');
                expect(createTokens.execute).not.toHaveBeenCalled();
            });

            it('should return failure if createTokens fails', async () => {
                createUser.execute.mockResolvedValue(Result.ok(fakeUser));
                findUserRoleByUserIdJustRoleId.execute.mockResolvedValue(Result.ok([]));
                createTokens.execute.mockResolvedValue(Result.failure(['Token creation error'], HttpStatus.INTERNAL_SERVER_ERROR));

                const result = await service.execute(fakeDto);

                expect(result.isSuccess).toBe(false);
                expect(result.errors[0]).toBe('Token creation error');
            });
        });
    });
});