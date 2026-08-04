import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { HttpStatus } from '@nestjs/common';
import { User } from 'src/modules/user/entities/user.entity';
import { Tokens } from '../../classes/token.class';
import { CreateTokensUseCase } from './create-token.use-case.service';
import { CreateRefreshTokenService } from '../../resfresh-token/services/create/create-refresh-token.use-case.service';
import { UserStatus } from 'src/common/enums/user/user-status.enum';
import { Result } from 'src/common/result/result';
import { RefreshTokenEntity } from '../../resfresh-token/entities/refresh-token.entity';

describe('CreateTokensUseCase ( UnitTest )', () => {
    let service: CreateTokensUseCase;
    let jwtService: jest.Mocked<JwtService>;
    let createRefreshTokenService: jest.Mocked<CreateRefreshTokenService>;
    let configService: jest.Mocked<ConfigService>;

    const mockJwtService = {
        sign: jest.fn(),
    };

    const mockCreateRefreshTokenService = {
        execute: jest.fn(),
    };

    const mockConfigService = {
        getOrThrow: jest.fn(),
    };

    const fakeUser: User = {
        id: 'user-uuid-1234',
        email: 'test@example.com',
        name: 'Test User',
        passwordHash: 'hashed-password',
        version: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        fullName: null,
        emailVerified: false,
        status: UserStatus.ACTIVE,
        lastLoginAt: null,
        deletedAt: null
    };

    const fakeRefreshToken: RefreshTokenEntity = {
        id: 'rt-uuid-1234',
        userId: fakeUser.id,
        tokenHash: 'mock-refresh-token-hash',
        expiresAt: new Date(Date.now() + 86400000),
        revokedAt: null,
        createdAt: new Date(),
    } as RefreshTokenEntity;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CreateTokensUseCase,
                {
                    provide: JwtService,
                    useValue: mockJwtService,
                },
                {
                    provide: CreateRefreshTokenService,
                    useValue: mockCreateRefreshTokenService,
                },
                {
                    provide: ConfigService,
                    useValue: mockConfigService,
                },
            ],
        }).compile();

        service = module.get<CreateTokensUseCase>(CreateTokensUseCase);
        jwtService = module.get(JwtService);
        createRefreshTokenService = module.get(CreateRefreshTokenService);
        configService = module.get(ConfigService);
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined and dependencies correctly mocked', () => {
        expect(service).toBeDefined();
        expect(jwtService).toBeDefined();
        expect(createRefreshTokenService).toBeDefined();
        expect(configService).toBeDefined();
    });

    describe('execute', () => {
        it('should successfully create access and refresh tokens (Happy Path)', async () => {
            const mockAccessToken = 'mock-access-token';

            jwtService.sign.mockReturnValue(mockAccessToken);

            configService.getOrThrow.mockImplementation((key: string) => {
                if (key === 'JWT_EXPIRATION_SECONDS') return '900';
                if (key === 'ISSUER') return 'my-issuer';
                if (key === 'AUDIENCE') return 'my-audience';
                throw new Error(`Missing key ${key}`);
            });

            createRefreshTokenService.execute.mockResolvedValue(Result.ok(fakeRefreshToken));

            const roles = ['admin', 'manager'];
            const result = await service.execute(fakeUser, roles);

            expect(result).toBeDefined();
            expect(result.isSuccess).toBe(true);
            expect(result.value).toBeInstanceOf(Tokens);
            expect(result.value.token).toBe(mockAccessToken);
            expect(result.value.tokenExp).toBeInstanceOf(Date);
            expect(result.value.refreshToken).toBe(fakeRefreshToken.tokenHash);
            expect(result.value.refreshTokenExp).toBe(fakeRefreshToken.expiresAt);

            expect(jwtService.sign).toHaveBeenCalledTimes(1);
            expect(jwtService.sign).toHaveBeenCalledWith(
                {
                    sub: fakeUser.id,
                    email: fakeUser.email,
                    name: fakeUser.name,
                    roles: roles,
                },
                {
                    expiresIn: 900,
                    issuer: 'my-issuer',
                    audience: 'my-audience',
                },
            );

            expect(createRefreshTokenService.execute).toHaveBeenCalledTimes(1);
            expect(createRefreshTokenService.execute).toHaveBeenCalledWith(fakeUser.id);
        });

        it('should assign an empty array to roles if not provided', async () => {
            jwtService.sign.mockReturnValue('mock-access-token');

            configService.getOrThrow.mockImplementation((key: string) => {
                if (key === 'JWT_EXPIRATION_SECONDS') return 900;
                if (key === 'ISSUER') return 'my-issuer';
                if (key === 'AUDIENCE') return 'my-audience';
                return null;
            });

            createRefreshTokenService.execute.mockResolvedValue(Result.ok(fakeRefreshToken));

            await service.execute(fakeUser);

            expect(jwtService.sign).toHaveBeenCalledWith(
                expect.objectContaining({
                    roles: [],
                }),
                expect.any(Object),
            );
        });

        describe('Sad Paths', () => {
            it('should return failure result when refresh token creation fails', async () => {
                jwtService.sign.mockReturnValue('mock-access-token');

                configService.getOrThrow.mockImplementation((key: string) => {
                    if (key === 'JWT_EXPIRATION_SECONDS') return 900;
                    if (key === 'ISSUER') return 'my-issuer';
                    if (key === 'AUDIENCE') return 'my-audience';
                    return null;
                });

                const failureResult: Result<RefreshTokenEntity> = Result.badRequest('Failed to create refresh token');
                createRefreshTokenService.execute.mockResolvedValue(failureResult);

                const result = await service.execute(fakeUser, ['user']);

                expect(result.isSuccess).toBe(false);
                expect(result.status).toBe(HttpStatus.BAD_REQUEST);
                expect(result.errors).toContain('Failed to create refresh token');
            });

            it('should throw error if configService.getOrThrow fails', async () => {
                configService.getOrThrow.mockImplementation(() => {
                    throw new Error('Config missing');
                });

                await expect(service.execute(fakeUser, ['user'])).rejects.toThrow('Config missing');
            });
        });
    });
});