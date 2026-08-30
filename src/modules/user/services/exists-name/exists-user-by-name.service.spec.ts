import { Test, TestingModule } from '@nestjs/testing';
import { ExistsUserByNameUseCase } from './exists-user-by-name.service';
import { IUserRepository } from '../../repository/iuser.repository';

describe('ExistsUserByNameUseCase (UnitTest)', () => {
    let service: ExistsUserByNameUseCase;
    let userRepository: jest.Mocked<IUserRepository>;

    const mockIUserRepository = {
        existsByName: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ExistsUserByNameUseCase,
                {
                    provide: IUserRepository,
                    useValue: mockIUserRepository,
                },
            ],
        }).compile();

        service = module.get<ExistsUserByNameUseCase>(ExistsUserByNameUseCase);
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
        it('should return Result.ok(true) when user exists by name (Happy Path)', async () => {
            const userName = 'John Doe';
            userRepository.existsByName.mockResolvedValue(true);

            const result = await service.execute(userName);

            expect(result).toBeDefined();
            expect(result.isSuccess).toBe(true);
            expect(result.value).toBe(true);

            expect(userRepository.existsByName).toHaveBeenCalledTimes(1);
            expect(userRepository.existsByName).toHaveBeenCalledWith(userName);
        });

        it('should return Result.ok(false) when user does not exist by name (Happy Path)', async () => {
            const userName = 'NonExistentUser';
            userRepository.existsByName.mockResolvedValue(false);

            const result = await service.execute(userName);

            expect(result).toBeDefined();
            expect(result.isSuccess).toBe(true);
            expect(result.value).toBe(false);

            expect(userRepository.existsByName).toHaveBeenCalledTimes(1);
            expect(userRepository.existsByName).toHaveBeenCalledWith(userName);
        });

        describe('Database Errors / Exceptions', () => {
            it('should propagate exception when repository throws an unexpected error', async () => {
                const userName = 'John Doe';
                const dbError = new Error('Database connection failed');
                userRepository.existsByName.mockRejectedValue(dbError);

                await expect(service.execute(userName)).rejects.toThrow('Database connection failed');

                expect(userRepository.existsByName).toHaveBeenCalledTimes(1);
                expect(userRepository.existsByName).toHaveBeenCalledWith(userName);
            });
        });
    });
});