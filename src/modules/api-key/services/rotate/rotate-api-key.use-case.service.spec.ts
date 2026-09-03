import { Test, TestingModule } from '@nestjs/testing';
import { InternalServerErrorException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { RotateApiKeyUseCase } from './rotate-api-key.use-case.service';
import { IApiKeyRepository } from '../../repository/iapi-key.repository';
import { IsOwnerUseCase } from 'src/modules/application/services/is-owner/is-owner.use-case.service';
import { ApiKeyEntity } from '../../entities/api-key.entity';
import { ApiKeyEnvironmentEnum } from 'src/common/enums/apiKeys/api-keys.enums';
import { Result } from 'src/common/result/result';

describe('RotateApiKeyUseCase', () => {
  let useCase: RotateApiKeyUseCase;
  let repository: jest.Mocked<IApiKeyRepository>;
  let isOwnerApplication: jest.Mocked<IsOwnerUseCase>;

  const apiKeyId = randomUUID();
  const userId = randomUUID();
  const applicationId = randomUUID();

  const mockApiKey: ApiKeyEntity = {
    id: apiKeyId,
    applicationId,
    createdBy: userId,
    name: 'Production Key',
    keyHash: 'old-hash',
    keyPrefix: 'pk_live_old',
    keyLastChars: '1234',
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
      findById: jest.fn(),
      update: jest.fn(),
    };

    const isOwnerMock = {
      execute: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RotateApiKeyUseCase,
        {
          provide: IApiKeyRepository,
          useValue: repositoryMock,
        },
        {
          provide: IsOwnerUseCase,
          useValue: isOwnerMock,
        },
      ],
    }).compile();

    useCase = module.get<RotateApiKeyUseCase>(RotateApiKeyUseCase);
    repository = module.get(IApiKeyRepository);
    isOwnerApplication = module.get(IsOwnerUseCase);
  });

  it('should return bad request if apiKeyId is not a valid UUID', async () => {
    const result = await useCase.execute('invalid-uuid', userId);

    expect(result.isFailure).toBe(true);
    expect(result.status).toBe(400);
    expect(result.errors[0]).toBe('API Key Id should be a valid UUID');
  });

  it('should return bad request if userId is not a valid UUID', async () => {
    const result = await useCase.execute(apiKeyId, 'invalid-uuid');

    expect(result.isFailure).toBe(true);
    expect(result.status).toBe(400);
    expect(result.errors[0]).toBe('User Id should be a valid UUID');
  });

  it('should return not found if API key does not exist', async () => {
    repository.findById.mockResolvedValue(null);

    const result = await useCase.execute(apiKeyId, userId);

    expect(result.isFailure).toBe(true);
    expect(result.status).toBe(404);
    expect(result.errors[0]).toBe('API key not found');
    expect(repository.findById).toHaveBeenCalledWith(apiKeyId);
  });

  it('should return failure if isOwnerApplication check fails', async () => {
    repository.findById.mockResolvedValue(mockApiKey);
    isOwnerApplication.execute.mockResolvedValue(Result.failure(['Ownership check failed'], 500));

    const result = await useCase.execute(apiKeyId, userId);

    expect(result.isFailure).toBe(true);
    expect(result.status).toBe(500);
    expect(result.errors[0]).toBe('Ownership check failed');
  });

  it('should return forbidden if user is not the owner of the application', async () => {
    repository.findById.mockResolvedValue(mockApiKey);
    isOwnerApplication.execute.mockResolvedValue(Result.ok(false));

    const result = await useCase.execute(apiKeyId, userId);

    expect(result.isFailure).toBe(true);
    expect(result.status).toBe(403);
    expect(result.errors[0]).toBe('User does not have access to this application');
  });

  it('should successfully rotate API key and return new credentials', async () => {
    repository.findById.mockResolvedValue(mockApiKey);
    isOwnerApplication.execute.mockResolvedValue(Result.ok(true));
    repository.update.mockImplementation(async (entity) => entity);

    const result = await useCase.execute(apiKeyId, userId);

    expect(result.isSuccess).toBe(true);
    expect(result.value.rawKey).toBeDefined();
    expect(result.value.rawKey.startsWith('pk_LIVE_')).toBe(true);
    expect(result.value.apiKey.keyHash).not.toBe('old-hash');
    expect(result.value.apiKey.keyPrefix).toBe(result.value.rawKey.slice(0, 12));
    expect(result.value.apiKey.keyLastChars).toBe(result.value.rawKey.slice(-4));
    expect(repository.update).toHaveBeenCalled();
  });

  it('should return conflict when database throws 23505 unique constraint error', async () => {
    repository.findById.mockResolvedValue(mockApiKey);
    isOwnerApplication.execute.mockResolvedValue(Result.ok(true));
    repository.update.mockRejectedValue({
      code: '23505',
      constraint_name: 'uk_api_keys_key_hash',
      detail: '(key_hash)=',
    });

    const result = await useCase.execute(apiKeyId, userId);

    expect(result.isFailure).toBe(true);
    expect(result.status).toBe(409);
    expect(result.errors[0]).toBe('Key Hash already exists.');
  });

  it('should return not found when database throws 23503 foreign key error', async () => {
    repository.findById.mockResolvedValue(mockApiKey);
    isOwnerApplication.execute.mockResolvedValue(Result.ok(true));
    repository.update.mockRejectedValue({ code: '23503' });

    const result = await useCase.execute(apiKeyId, userId);

    expect(result.isFailure).toBe(true);
    expect(result.status).toBe(404);
    expect(result.errors[0]).toBe('Related record not found.');
  });

  it('should return bad request when database throws 22001 length exceeded error', async () => {
    repository.findById.mockResolvedValue(mockApiKey);
    isOwnerApplication.execute.mockResolvedValue(Result.ok(true));
    repository.update.mockRejectedValue({ code: '22001' });

    const result = await useCase.execute(apiKeyId, userId);

    expect(result.isFailure).toBe(true);
    expect(result.status).toBe(400);
    expect(result.errors[0]).toBe('One or more fields exceed the maximum allowed length.');
  });

  it('should throw InternalServerErrorException for unhandled database errors', async () => {
    repository.findById.mockResolvedValue(mockApiKey);
    isOwnerApplication.execute.mockResolvedValue(Result.ok(true));
    repository.update.mockRejectedValue(new Error('Unexpected DB Error'));

    await expect(useCase.execute(apiKeyId, userId)).rejects.toThrow(InternalServerErrorException);
  });
});
