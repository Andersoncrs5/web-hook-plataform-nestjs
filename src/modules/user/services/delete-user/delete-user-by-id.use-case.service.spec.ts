import { Test, TestingModule } from '@nestjs/testing';
import { IUserRepository } from '../../repository/iuser.repository';
import { DeleteByIdUserUseCase } from './delete-user-by-id.use-case.service';

describe('DeleteByIdUserUseCase ( UnitTest )', () => {
    let service: DeleteByIdUserUseCase;
    let userRepository: jest.Mocked<IUserRepository>;

    const mockIUserRepository = {
        deleteById: jest.fn(),
    };

    const fakeUserId = 'user-uuid-1234-5678';

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DeleteByIdUserUseCase,
                {
                    provide: IUserRepository,
                    useValue: mockIUserRepository,
                },
            ],
        }).compile();

        service = module.get<DeleteByIdUserUseCase>(DeleteByIdUserUseCase);
        userRepository = module.get(IUserRepository);
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined and dependencies correctly mocked', () => {
        expect(service).toBeDefined();
        expect(userRepository).toBeDefined();
    });

    describe('execute', () => {
        it('should successfully delete a user when id exists (Happy Path)', async () => {
            userRepository.deleteById.mockResolvedValue(true);

            const result = await service.execute(fakeUserId);

            expect(result).toBeDefined();
            expect(result.isSuccess).toBe(true);
            
            expect(userRepository.deleteById).toHaveBeenCalledTimes(1);
            expect(userRepository.deleteById).toHaveBeenCalledWith(fakeUserId);
        });

        it('should return a not found result when user does not exist (Sad Path)', async () => {
            userRepository.deleteById.mockResolvedValue(false);

            const result = await service.execute(fakeUserId);

            expect(result).toBeDefined();
            expect(result.isSuccess).toBe(false);
            expect(result.errors[0]).toBe('User not found');

            expect(userRepository.deleteById).toHaveBeenCalledTimes(1);
            expect(userRepository.deleteById).toHaveBeenCalledWith(fakeUserId);
        });
    });
});