import { Test, TestingModule } from '@nestjs/testing';
import { IApplicationRepository } from '../../repository/iapplication.repository';
import { IsOwnerUseCase } from './is-owner.use-case.service';

describe('IsOwnerUseCase', () => {
  let useCase: IsOwnerUseCase;
  let repository: jest.Mocked<IApplicationRepository>;

  const validApplicationId = '123e4567-e89b-12d3-a456-426614174000';
  const validUserId = '987e6543-e21b-12d3-a456-426614174000';
  const invalidUuid = 'invalid-uuid';

  beforeEach(async () => {
    const repositoryMock: Partial<jest.Mocked<IApplicationRepository>> = {
      isOwner: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IsOwnerUseCase,
        {
          provide: IApplicationRepository,
          useValue: repositoryMock,
        },
      ],
    }).compile();

    useCase = module.get<IsOwnerUseCase>(IsOwnerUseCase);
    repository = module.get(IApplicationRepository);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should return badRequest if applicationId is not a valid UUID', async () => {
    const result = await useCase.execute(invalidUuid, validUserId);

    expect(result.isFailure).toBe(true);
    expect(result.errors[0]).toBe('Id should be a valid UUID');
    expect(repository.isOwner).not.toHaveBeenCalled();
  });

  it('should return badRequest if userId is not a valid UUID', async () => {
    const result = await useCase.execute(validApplicationId, invalidUuid);

    expect(result.isFailure).toBe(true);
    expect(result.errors[0]).toBe('Id should be a valid UUID');
    expect(repository.isOwner).not.toHaveBeenCalled();
  });

  it('should return Result.ok(true) when user is the owner', async () => {
    repository.isOwner.mockResolvedValue(true);

    const result = await useCase.execute(validApplicationId, validUserId);

    expect(repository.isOwner).toHaveBeenCalledWith(validApplicationId, validUserId);
    expect(result.isSuccess).toBe(true);
    expect(result.value).toBe(true);
  });

  it('should return Result.ok(false) when user is not the owner', async () => {
    repository.isOwner.mockResolvedValue(false);

    const result = await useCase.execute(validApplicationId, validUserId);

    expect(repository.isOwner).toHaveBeenCalledWith(validApplicationId, validUserId);
    expect(result.isSuccess).toBe(true);
    expect(result.value).toBe(false);
  });
});
