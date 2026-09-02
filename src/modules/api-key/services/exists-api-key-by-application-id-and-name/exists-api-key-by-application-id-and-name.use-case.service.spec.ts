import { Test, TestingModule } from '@nestjs/testing';
import { InternalServerErrorException } from '@nestjs/common';
import { ExistsApiKeyByApplicationIdAndNameUseCase } from './exists-api-key-by-application-id-and-name.use-case.service';
import { IApiKeyRepository } from '../../repository/iapi-key.repository';

describe('ExistsApiKeyByApplicationIdAndNameUseCase', () => {
  let useCase: ExistsApiKeyByApplicationIdAndNameUseCase;
  let repository: jest.Mocked<IApiKeyRepository>;

  const validApplicationId = '123e4567-e89b-12d3-a456-426614174000';
  const validName = 'Production Key';
  const invalidUuid = 'invalid-uuid';

  beforeEach(async () => {
    const repositoryMock: Partial<jest.Mocked<IApiKeyRepository>> = {
      existsByApplicationIdAndName: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExistsApiKeyByApplicationIdAndNameUseCase,
        {
          provide: IApiKeyRepository,
          useValue: repositoryMock,
        },
      ],
    }).compile();

    useCase = module.get<ExistsApiKeyByApplicationIdAndNameUseCase>(
      ExistsApiKeyByApplicationIdAndNameUseCase,
    );
    repository = module.get(IApiKeyRepository);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should return badRequest if applicationId is not a valid UUID', async () => {
    const result = await useCase.execute(invalidUuid, validName);

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe('Application Id should be a valid UUID');
    expect(repository.existsByApplicationIdAndName).not.toHaveBeenCalled();
  });

  it('should return badRequest if name is empty or whitespace', async () => {
    const result = await useCase.execute(validApplicationId, '   ');

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe('Name should be a non-empty string');
    expect(repository.existsByApplicationIdAndName).not.toHaveBeenCalled();
  });

  it('should return Result.ok(true) when api key name exists for the application', async () => {
    repository.existsByApplicationIdAndName.mockResolvedValue(true);

    const result = await useCase.execute(validApplicationId, validName);

    expect(repository.existsByApplicationIdAndName).toHaveBeenCalledWith(
      validApplicationId,
      validName,
    );
    expect(result.isSuccess).toBe(true);
    expect(result.value).toBe(true);
  });

  it('should return Result.ok(false) when api key name does not exist for the application', async () => {
    repository.existsByApplicationIdAndName.mockResolvedValue(false);

    const result = await useCase.execute(validApplicationId, validName);

    expect(repository.existsByApplicationIdAndName).toHaveBeenCalledWith(
      validApplicationId,
      validName,
    );
    expect(result.isSuccess).toBe(true);
    expect(result.value).toBe(false);
  });

  it('should throw InternalServerErrorException when repository fails', async () => {
    repository.existsByApplicationIdAndName.mockRejectedValue(new Error('Database error'));

    await expect(useCase.execute(validApplicationId, validName)).rejects.toThrow(
      InternalServerErrorException,
    );
  });
});
