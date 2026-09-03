import { Test, TestingModule } from '@nestjs/testing';
import { InternalServerErrorException } from '@nestjs/common';
import { UpdateApiKeyUseCase } from './update-api-key.use-case.service';
import { IApiKeyRepository } from '../../repository/iapi-key.repository';
import { UpdateApiKeyDto } from '../../dto/request/update-api-key.dto';
import { ApiKeyEntity } from '../../entities/api-key.entity';
import { ApiKeyEnvironmentEnum } from 'src/common/enums/apiKeys/api-keys.enums';

describe('UpdateApiKeyUseCase', () => {
  let useCase: UpdateApiKeyUseCase;
  let repository: jest.Mocked<IApiKeyRepository>;

  const validId = '123e4567-e89b-12d3-a456-426614174000';
  const validUserId = '987e6543-e21b-12d3-a456-426614174000';
  const otherUserId = '11111111-2222-4333-a444-555555555555'; // UUID v4 válido
  const invalidUuid = 'invalid-uuid';

  const defaultDto: UpdateApiKeyDto = {
    name: 'Updated Key Name',
    enabled: false,
  };

  const existingApiKey: ApiKeyEntity = {
    id: validId,
    applicationId: 'app-uuid-123',
    createdBy: validUserId,
    name: 'Original Key Name',
    keyHash: 'hash-value',
    keyPrefix: 'pk_live_1234',
    keyLastChars: '5678',
    environment: ApiKeyEnvironmentEnum.LIVE,
    enabled: true,
    expiresAt: null,
    version: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as ApiKeyEntity;

  beforeEach(async () => {
    const repositoryMock: Partial<jest.Mocked<IApiKeyRepository>> = {
      findById: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateApiKeyUseCase,
        {
          provide: IApiKeyRepository,
          useValue: repositoryMock,
        },
      ],
    }).compile();

    useCase = module.get<UpdateApiKeyUseCase>(UpdateApiKeyUseCase);
    repository = module.get(IApiKeyRepository);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should return badRequest if userId is not a valid UUID', async () => {
    const result = await useCase.execute(validId, defaultDto, invalidUuid);

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe('User Id should be a valid UUID');
    expect(repository.findById).not.toHaveBeenCalled();
  });

  it('should return badRequest if id is not a valid UUID', async () => {
    const result = await useCase.execute(invalidUuid, defaultDto, validUserId);

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe('Id should be a valid UUID');
    expect(repository.findById).not.toHaveBeenCalled();
  });

  it('should return notFound when api key does not exist', async () => {
    repository.findById.mockResolvedValue(null);

    const result = await useCase.execute(validId, defaultDto, validUserId);

    expect(repository.findById).toHaveBeenCalledWith(validId);
    expect(result.isFailure).toBe(true);
    expect(result.error).toBe('Api key not found');
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('should return forbidden when api key does not belong to user', async () => {
    repository.findById.mockResolvedValue(existingApiKey);

    const result = await useCase.execute(validId, defaultDto, otherUserId);

    expect(repository.findById).toHaveBeenCalledWith(validId);
    expect(result.isFailure).toBe(true);
    expect(result.error).toBe('Api key is not yours');
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('should update api key successfully and return updated entity', async () => {
    repository.findById.mockResolvedValue({ ...existingApiKey });

    const updatedResultEntity = {
      ...existingApiKey,
      name: 'Updated Key Name',
      enabled: false,
    };

    repository.update.mockResolvedValue(updatedResultEntity);

    const result = await useCase.execute(validId, defaultDto, validUserId);

    expect(repository.findById).toHaveBeenCalledWith(validId);
    expect(repository.update).toHaveBeenCalledWith(
      expect.objectContaining({
        id: validId,
        name: 'Updated Key Name',
        enabled: false,
      }),
    );
    expect(result.isSuccess).toBe(true);
    expect(result.value).toEqual(updatedResultEntity);
  });

  describe('Database Exception Handling', () => {
    beforeEach(() => {
      repository.findById.mockResolvedValue({ ...existingApiKey });
    });

    it('should return conflict when name constraint violates 23505', async () => {
      repository.update.mockRejectedValue({
        code: '23505',
        constraint_name: 'uk_api_keys_application_name',
        detail: 'Key (application_id, name)=(..., Updated Key Name) already exists.',
      });

      const result = await useCase.execute(validId, defaultDto, validUserId);

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain(`Name '${defaultDto.name}' already exists.`);
    });

    it('should return badRequest on value length error (code 22001)', async () => {
      repository.update.mockRejectedValue({
        code: '22001',
      });

      const result = await useCase.execute(validId, defaultDto, validUserId);

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe('One or more fields exceed the maximum allowed length.');
    });

    it('should throw InternalServerErrorException on unexpected database error', async () => {
      repository.update.mockRejectedValue(new Error('Unexpected DB error'));

      await expect(useCase.execute(validId, defaultDto, validUserId)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });
});
