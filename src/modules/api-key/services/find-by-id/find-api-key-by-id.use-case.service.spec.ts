import { Test, TestingModule } from '@nestjs/testing';
import { FindApiKeyByIdUseCase } from './find-api-key-by-id.use-case.service';
import { IApiKeyRepository } from '../../repository/iapi-key.repository';
import { ApiKeyEntity } from '../../entities/api-key.entity';

describe('FindApiKeyByIdUseCase', () => {
  let useCase: FindApiKeyByIdUseCase;
  let repository: jest.Mocked<IApiKeyRepository>;

  const validId = '123e4567-e89b-12d3-a456-426614174000';
  const validUserId = '987e6543-e21b-12d3-a456-426614174000';
  const otherUserId = '11111111-2222-3333-4444-555555555555';
  const invalidUuid = 'invalid-uuid';

  const fakeApiKey: ApiKeyEntity = {
    id: validId,
    applicationId: 'app-uuid-123',
    createdBy: validUserId,
    name: 'Production Key',
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
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindApiKeyByIdUseCase,
        {
          provide: IApiKeyRepository,
          useValue: repositoryMock,
        },
      ],
    }).compile();

    useCase = module.get<FindApiKeyByIdUseCase>(FindApiKeyByIdUseCase);
    repository = module.get(IApiKeyRepository);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should return badRequest if userId is not a valid UUID', async () => {
    const result = await useCase.execute(validId, invalidUuid);

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe('User Id should be a valid UUID');
    expect(repository.findById).not.toHaveBeenCalled();
  });

  it('should return badRequest if id is not a valid UUID', async () => {
    const result = await useCase.execute(invalidUuid, validUserId);

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe('Id should be a valid UUID');
    expect(repository.findById).not.toHaveBeenCalled();
  });

  it('should return notFound if entity does not exist', async () => {
    repository.findById.mockResolvedValue(null);

    const result = await useCase.execute(validId, validUserId);

    expect(repository.findById).toHaveBeenCalledWith(validId);
    expect(result.isFailure).toBe(true);
    expect(result.error).toBe('Api key not found');
  });

  it('should return Result.ok with the entity when found and authorized', async () => {
    repository.findById.mockResolvedValue(fakeApiKey);

    const result = await useCase.execute(validId, validUserId);

    expect(repository.findById).toHaveBeenCalledWith(validId);
    expect(result.isSuccess).toBe(true);
    expect(result.value).toEqual(fakeApiKey);
  });
});
