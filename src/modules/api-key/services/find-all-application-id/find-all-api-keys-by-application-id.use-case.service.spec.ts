import { Test, TestingModule } from '@nestjs/testing';
import { InternalServerErrorException } from '@nestjs/common';
import { FindAllApiKeysByApplicationIdUseCase } from './find-all-api-keys-by-application-id.use-case.service';
import { IApiKeyRepository } from '../../repository/iapi-key.repository';
import { ApiKeyEntity } from '../../entities/api-key.entity';

describe('FindAllApiKeysByApplicationIdUseCase', () => {
  let useCase: FindAllApiKeysByApplicationIdUseCase;
  let repository: jest.Mocked<IApiKeyRepository>;

  const validApplicationId = '123e4567-e89b-12d3-a456-426614174000';
  const invalidUuid = 'invalid-uuid';

  const fakeApiKey: ApiKeyEntity = {
    id: '987e6543-e21b-12d3-a456-426614174000',
    applicationId: validApplicationId,
    createdBy: '555e6543-e21b-12d3-a456-426614174000',
    name: 'App Key 1',
    keyHash: 'hash-value',
    keyPrefix: 'pk_live_1234',
    keyLastChars: '5678',
    environment: 'live' as any,
    enabled: true,
    version: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as ApiKeyEntity;

  beforeEach(async () => {
    const repositoryMock: Partial<jest.Mocked<IApiKeyRepository>> = {
      findAllByApplicationId: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindAllApiKeysByApplicationIdUseCase,
        {
          provide: IApiKeyRepository,
          useValue: repositoryMock,
        },
      ],
    }).compile();

    useCase = module.get<FindAllApiKeysByApplicationIdUseCase>(
      FindAllApiKeysByApplicationIdUseCase,
    );
    repository = module.get(IApiKeyRepository);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should return badRequest if applicationId is not a valid UUID', async () => {
    const result = await useCase.execute(invalidUuid);

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe('Application Id should be a valid UUID');
    expect(repository.findAllByApplicationId).not.toHaveBeenCalled();
  });

  it('should return an array of api keys successfully', async () => {
    const keysList = [fakeApiKey];
    repository.findAllByApplicationId.mockResolvedValue(keysList);

    const result = await useCase.execute(validApplicationId);

    expect(repository.findAllByApplicationId).toHaveBeenCalledWith(validApplicationId, undefined);
    expect(result.isSuccess).toBe(true);
    expect(result.value).toEqual(keysList);
  });

  it('should pass limit parameter to repository when provided', async () => {
    const limit = 5;
    const keysList = [fakeApiKey];
    repository.findAllByApplicationId.mockResolvedValue(keysList);

    const result = await useCase.execute(validApplicationId, limit);

    expect(repository.findAllByApplicationId).toHaveBeenCalledWith(validApplicationId, limit);
    expect(result.isSuccess).toBe(true);
    expect(result.value).toEqual(keysList);
  });

  it('should throw InternalServerErrorException when repository fails', async () => {
    repository.findAllByApplicationId.mockRejectedValue(new Error('Database error'));

    await expect(useCase.execute(validApplicationId)).rejects.toThrow(InternalServerErrorException);
  });
});
