import { Test, TestingModule } from '@nestjs/testing';
import { FindUserByIdUserUseCase } from './find-by-id-user.use-case.service';
import { IUserRepository } from '../../repository/iuser.repository';
import { User } from '../../entities/user.entity';

describe('FindByIdUserUseCase ( UnitTest )', () => {
    let service: FindUserByIdUserUseCase;
    let userRepository: jest.Mocked<IUserRepository>;

    const mockIUserRepository = {
        findById: jest.fn(),
    };

    const fakeUuid = 'user-uuid-1234-5678';
    
    const userMock = User.create({
        id: fakeUuid,
        name: 'John Doe',
        fullName: 'Johnathan Doe',
        email: 'johndoe@example.com',
        passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$fakehash',
    });

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                FindUserByIdUserUseCase,
                {
                    provide: IUserRepository,
                    useValue: mockIUserRepository,
                },
            ],
        }).compile();

        service = module.get<FindUserByIdUserUseCase>(FindUserByIdUserUseCase);
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
        it('should successfully return a user when id exists (Happy Path)', async () => {
            userRepository.findById.mockResolvedValue(userMock);

            const result = await service.execute(fakeUuid);

            expect(result).toBeDefined();
            expect(result.isSuccess).toBe(true);
            expect(result.value).toEqual(userMock);

            expect(userRepository.findById).toHaveBeenCalledTimes(1);
            expect(userRepository.findById).toHaveBeenCalledWith(fakeUuid);
        });

        it('should return a not found result when user does not exist (Sad Path)', async () => {
            userRepository.findById.mockResolvedValue(null);

            const result = await service.execute(fakeUuid);

            expect(result).toBeDefined();
            expect(result.isSuccess).toBe(false);
            expect(result.errors[0]).toBe('User not found');

            expect(userRepository.findById).toHaveBeenCalledTimes(1);
            expect(userRepository.findById).toHaveBeenCalledWith(fakeUuid);
        });
    });
});