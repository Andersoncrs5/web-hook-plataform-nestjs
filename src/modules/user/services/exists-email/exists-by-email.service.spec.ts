import { Test, TestingModule } from '@nestjs/testing';
import { ExistsUserByEmailUseCase } from './exists-by-email.service';
import { IUserRepository } from '../../repository/iuser.repository';
import { Result } from 'src/common/result/result';

describe('ExistsUserByEmailUseCase (UnitTest)', () => {
    let service: ExistsUserByEmailUseCase;
    let userRepository: jest.Mocked<IUserRepository>;

    const mockIUserRepository = {
        existsByEmail: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ExistsUserByEmailUseCase,
                {
                    provide: IUserRepository,
                    useValue: mockIUserRepository,
                },
            ],
        }).compile();

        service = module.get<ExistsUserByEmailUseCase>(ExistsUserByEmailUseCase);
        userRepository = module.get(IUserRepository);
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined and dependencies correctly injected', () => {
        expect(service).toBeDefined();
        expect(userRepository).toBeDefined();
    });

    describe('execute', () => {
        it('should return Result.ok(true) when the email exists in repository (Happy Path)', async () => {
            const validEmail = 'user@domain.com';
            userRepository.existsByEmail.mockResolvedValue(true);

            const result = await service.execute(validEmail);

            expect(result).toBeDefined();
            expect(result.isSuccess).toBe(true);
            expect(result.value).toBe(true);

            expect(userRepository.existsByEmail).toHaveBeenCalledTimes(1);
            expect(userRepository.existsByEmail).toHaveBeenCalledWith(validEmail);
        });

        it('should return Result.ok(false) when the email does not exist in repository (Happy Path)', async () => {
            const validEmail = 'nonexistent@domain.com';
            userRepository.existsByEmail.mockResolvedValue(false);

            const result = await service.execute(validEmail);

            expect(result).toBeDefined();
            expect(result.isSuccess).toBe(true);
            expect(result.value).toBe(false);

            expect(userRepository.existsByEmail).toHaveBeenCalledTimes(1);
            expect(userRepository.existsByEmail).toHaveBeenCalledWith(validEmail);
        });

        describe('Validation Rules (Sad Paths)', () => {
            it.each([
                ['empty string', ''],
                ['invalid email format', 'invalid-email-string'],
                ['missing domain', 'user@'],
                ['missing username', '@domain.com'],
                ['whitespace only', '   '],
                ['null', null as any],
                ['undefined', undefined as any],
            ])('should return bad request when email is %s', async (_, invalidEmail) => {
                const result = await service.execute(invalidEmail);

                expect(result.isSuccess).toBe(false);
                expect(result.errors[0]).toBe('Email invalid');

                expect(userRepository.existsByEmail).not.toHaveBeenCalled();
            });
        });

        describe('Database Errors / Exceptions', () => {
            it('should propagate exception when repository throws an unexpected error', async () => {
                const validEmail = 'user@domain.com';
                const dbError = new Error('Database connection failed');
                userRepository.existsByEmail.mockRejectedValue(dbError);

                await expect(service.execute(validEmail)).rejects.toThrow('Database connection failed');

                expect(userRepository.existsByEmail).toHaveBeenCalledTimes(1);
                expect(userRepository.existsByEmail).toHaveBeenCalledWith(validEmail);
            });
        });
    });
});