import { Test, TestingModule } from '@nestjs/testing';
import { InternalServerErrorException } from '@nestjs/common';

import { IApiKeyRepository } from '../../repository/iapi-key.repository';
import { IsOwnerUseCase } from 'src/modules/application/services/is-owner/is-owner.use-case.service';
import { CreateApiKeyDto } from '../../dto/request/create-api-key.dto';
import { ApiKeyEnvironmentEnum } from 'src/common/enums/apiKeys/api-keys.enums';
import { Result } from 'src/common/result/result';
import { ApiKeyEntity } from '../../entities/api-key.entity';
import { CreateApiKeyResponse, CreateApiKeyUseCase } from './create-api-key.use-case.service';

describe('CreateApiKeyUseCase', () => {
  let useCase: CreateApiKeyUseCase;
  let repository: jest.Mocked<IApiKeyRepository>;
  let isOwnerUseCase: jest.Mocked<IsOwnerUseCase>;

  const validUserId = '123e4567-e89b-12d3-a456-426614174000';
  const validApplicationId = '987e6543-e21b-12d3-a456-426614174000';
  const invalidUserId = 'invalid-uuid';

  const defaultDto: CreateApiKeyDto = {
    applicationId: validApplicationId,
    name: 'Production Key',
    environment: ApiKeyEnvironmentEnum.LIVE,
    enabled: true,
  };

  beforeEach(async () => {
    const repositoryMock: Partial<jest.Mocked<IApiKeyRepository>> = {
      create: jest.fn(),
    };

    const isOwnerMock: Partial<jest.Mocked<IsOwnerUseCase>> = {
      execute: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateApiKeyUseCase,
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

    useCase = module.get<CreateApiKeyUseCase>(CreateApiKeyUseCase);
    repository = module.get(IApiKeyRepository);
    isOwnerUseCase = module.get(IsOwnerUseCase);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should return badRequest if userId is not a valid UUID', async () => {
    const result: Result<CreateApiKeyResponse> = await useCase.execute(defaultDto, invalidUserId);

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe('User Id should be a valid UUID');
    expect(isOwnerUseCase.execute).not.toHaveBeenCalled();
  });

  it('should propagate failure if isOwnerApplication execution fails', async () => {
    isOwnerUseCase.execute.mockResolvedValue(
      Result.badRequest('Invalid application ID format') as any,
    );

    const result = await useCase.execute(defaultDto, validUserId);

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe('Invalid application ID format');
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('should return forbidden if user is not the owner of the application', async () => {
    isOwnerUseCase.execute.mockResolvedValue(Result.ok(false));

    const result = await useCase.execute(defaultDto, validUserId);

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe('User does not have access to this application');
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('should create an API key successfully and return entity with rawKey', async () => {
    isOwnerUseCase.execute.mockResolvedValue(Result.ok(true));

    const fakeCreatedEntity: ApiKeyEntity = {
      id: 'key-uuid-123',
      applicationId: defaultDto.applicationId,
      createdBy: validUserId,
      name: defaultDto.name,
      keyHash: 'computed-hash',
      keyPrefix: 'pk_live_1234',
      keyLastChars: '5678',
      environment: ApiKeyEnvironmentEnum.LIVE,
      enabled: true,
      version: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as ApiKeyEntity;

    repository.create.mockResolvedValue(fakeCreatedEntity);

    const result: Result<CreateApiKeyResponse> = await useCase.execute(defaultDto, validUserId);

    expect(result.isSuccess).toBe(true);
    const value = result.value;

    expect(value.apiKey).toBe(fakeCreatedEntity);
    expect(value.rawKey).toBeDefined();
    expect(value.rawKey.startsWith('pk_live_')).toBe(true);

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        applicationId: defaultDto.applicationId,
        createdBy: validUserId,
        name: defaultDto.name,
        environment: ApiKeyEnvironmentEnum.LIVE,
        enabled: true,
      }),
    );
  });

  describe('PostgreSQL Exception Mapping', () => {
    beforeEach(() => {
      isOwnerUseCase.execute.mockResolvedValue(Result.ok(true));
    });

    it('should return conflict when name constraint violates 23505', async () => {
      repository.create.mockRejectedValue({
        code: '23505',
        constraint_name: 'uk_api_keys_application_name',
        detail: 'Key (application_id, name)=(..., Production Key) already exists.',
      });

      const result = await useCase.execute(defaultDto, validUserId);

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain(`Name '${defaultDto.name}' already exists.`);
    });

    it('should return conflict when key_hash constraint violates 23505', async () => {
      repository.create.mockRejectedValue({
        code: '23505',
        constraint_name: 'uk_api_keys_key_hash',
        detail: 'Key (key_hash)=(...) already exists.',
      });

      const result = await useCase.execute(defaultDto, validUserId);

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe('Key Hash already exists.');
    });

    it('should return notFound when application foreign key violates 23503', async () => {
      repository.create.mockRejectedValue({
        code: '23503',
        constraint_name: 'fk_api_keys_application',
        detail: 'Key (application_id)=(...) is not present in table "applications".',
      });

      const result = await useCase.execute(defaultDto, validUserId);

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe('The specified Application does not exist.');
    });

    it('should return badRequest when non-null column is missing (23502)', async () => {
      repository.create.mockRejectedValue({
        code: '23502',
        column: 'name',
      });

      const result = await useCase.execute(defaultDto, validUserId);

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe('The field "name" cannot be null.');
    });

    it('should throw InternalServerErrorException on unknown database error', async () => {
      repository.create.mockRejectedValue(new Error('Database offline'));

      await expect(useCase.execute(defaultDto, validUserId)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });
});
