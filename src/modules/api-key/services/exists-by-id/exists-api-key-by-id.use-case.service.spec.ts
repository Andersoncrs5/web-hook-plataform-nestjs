import { Test, TestingModule } from '@nestjs/testing';
import { InternalServerErrorException } from '@nestjs/common';
import { ExistsApiKeyByIdUseCase } from './exists-api-key-by-id.use-case.service';
import { IApiKeyRepository } from '../../repository/iapi-key.repository';

describe('ExistsApiKeyByIdUseCase', () => {
  let useCase: ExistsApiKeyByIdUseCase;
  let repository: jest.Mocked<IApiKeyRepository>;

  const validId = '123e4567-e89b-12d3-a456-426614174000';
  const invalidUuid = 'invalid-uuid';

  beforeEach(async () => {
    const repositoryMock: Partial<jest.Mocked<IApiKeyRepository>> = {
      existsById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExistsApiKeyByIdUseCase,
        {
          provide: IApiKeyRepository,
          useValue: repositoryMock,
        },
      ],
    }).compile();

    useCase = module.get<ExistsApiKeyByIdUseCase>(ExistsApiKeyByIdUseCase);
    repository = module.get(IApiKeyRepository);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should return badRequest if id is not a valid UUID', async () => {
    const result = await useCase.execute(invalidUuid);

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe('Id should be a valid UUID');
    expect(repository.existsById).not.toHaveBeenCalled();
  });

  it('should return Result.ok(true) when api key exists by id', async () => {
    repository.existsById.mockResolvedValue(true);

    const result = await useCase.execute(validId);

    expect(repository.existsById).toHaveBeenCalledWith(validId);
    expect(result.isSuccess).toBe(true);
    expect(result.value).toBe(true);
  });

  it('should return Result.ok(false) when api key does not exist by id', async () => {
    repository.existsById.mockResolvedValue(false);

    const result = await useCase.execute(validId);

    expect(repository.existsById).toHaveBeenCalledWith(validId);
    expect(result.isSuccess).toBe(true);
    expect(result.value).toBe(false);
  });

  it('should throw InternalServerErrorException when repository fails', async () => {
    repository.existsById.mockRejectedValue(new Error('Database error'));

    await expect(useCase.execute(validId)).rejects.toThrow(InternalServerErrorException);
  });
});
