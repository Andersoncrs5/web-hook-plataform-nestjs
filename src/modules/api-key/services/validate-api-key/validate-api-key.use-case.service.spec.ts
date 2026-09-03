import { Test, TestingModule } from '@nestjs/testing';
import { createHash } from 'crypto';
import { ValidateApiKeyUseCase } from './validate-api-key.use-case.service';
import { IApiKeyRepository } from '../../repository/iapi-key.repository';
import { ApiKeyEntity } from '../../entities/api-key.entity';
import { ApiKeyEnvironmentEnum } from 'src/common/enums/apiKeys/api-keys.enums';

describe('ValidateApiKeyUseCase', () => {
  let useCase: ValidateApiKeyUseCase;
  let repository: jest.Mocked<IApiKeyRepository>;

  const rawKey = 'pk_live_123456789';
  const expectedHash = createHash('sha256').update(rawKey).digest('hex');

  const baseApiKey: ApiKeyEntity = {
    id: 'key-id',
    applicationId: 'app-id',
    createdBy: 'user-id',
    name: 'Production Key',
    keyHash: expectedHash,
    keyPrefix: 'pk_live_',
    keyLastChars: '6789',
    environment: ApiKeyEnvironmentEnum.LIVE,
    enabled: true,
    expiresAt: null,
    lastUsedAt: null,
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  beforeEach(async () => {
    const repositoryMock = {
      findByKeyHash: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ValidateApiKeyUseCase,
        {
          provide: IApiKeyRepository,
          useValue: repositoryMock,
        },
      ],
    }).compile();

    useCase = module.get<ValidateApiKeyUseCase>(ValidateApiKeyUseCase);
    repository = module.get(IApiKeyRepository);
  });

  it('should return bad request when rawApiKey is missing or not a string', async () => {
    const result = await useCase.execute('' as any);

    expect(result.isFailure).toBe(true);
    expect(result.status).toBe(400);
    expect(result.errors[0]).toBe('API Key is required');
  });

  it('should return not found when API key does not exist', async () => {
    repository.findByKeyHash.mockResolvedValue(null);

    const result = await useCase.execute(rawKey);

    expect(result.isFailure).toBe(true);
    expect(result.status).toBe(404);
    expect(repository.findByKeyHash).toHaveBeenCalledWith(expectedHash);
  });

  it('should return bad request when API key environment is not LIVE', async () => {
    const testApiKey: ApiKeyEntity = {
      ...baseApiKey,
      environment: ApiKeyEnvironmentEnum.TEST,
    };
    repository.findByKeyHash.mockResolvedValue(testApiKey);

    const result = await useCase.execute(rawKey);

    expect(result.isFailure).toBe(true);
    expect(result.status).toBe(400);
    expect(result.errors[0]).toBe('Api Key is not LIVE');
  });

  it('should return bad request when API key is disabled', async () => {
    const disabledApiKey: ApiKeyEntity = {
      ...baseApiKey,
      enabled: false,
    };
    repository.findByKeyHash.mockResolvedValue(disabledApiKey);

    const result = await useCase.execute(rawKey);

    expect(result.isFailure).toBe(true);
    expect(result.status).toBe(400);
    expect(result.errors[0]).toBe('Api Key is disabled');
  });

  it('should return gone status when API key is expired', async () => {
    const pastDate = new Date(Date.now() - 10000);
    const expiredApiKey: ApiKeyEntity = {
      ...baseApiKey,
      expiresAt: pastDate,
    };
    repository.findByKeyHash.mockResolvedValue(expiredApiKey);

    const result = await useCase.execute(rawKey);

    expect(result.isFailure).toBe(true);
    expect(result.status).toBe(410);
    expect(result.errors[0]).toBe('Api Key expired!');
  });

  it('should return ok with ApiKeyEntity when validation passes', async () => {
    repository.findByKeyHash.mockResolvedValue(baseApiKey);

    const result = await useCase.execute(rawKey);

    expect(result.isSuccess).toBe(true);
    expect(result.value).toEqual(baseApiKey);
    expect(repository.findByKeyHash).toHaveBeenCalledWith(expectedHash);
  });
});
