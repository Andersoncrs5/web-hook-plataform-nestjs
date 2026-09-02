import { Test, TestingModule } from '@nestjs/testing';
import { IApiKeyRepository } from '../../repository/iapi-key.repository';
import { IsOwnerUseCase } from 'src/modules/application/services/is-owner/is-owner.use-case.service';
import { Result } from 'src/common/result/result';
import { randomUUID } from 'crypto';
import { CountApiKeysByApplicationIdUseCase } from './count-api-keys-by-application-id.use-case.service';

describe('CountApiKeysByApplicationIdUseCase', () => {
  let useCase: CountApiKeysByApplicationIdUseCase;
  let repository: jest.Mocked<IApiKeyRepository>;
  let isOwnerApplication: jest.Mocked<IsOwnerUseCase>;

  beforeEach(async () => {
    const repositoryMock = {
      countByApplicationId: jest.fn(),
    };

    const isOwnerMock = {
      execute: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CountApiKeysByApplicationIdUseCase,
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

    useCase = module.get<CountApiKeysByApplicationIdUseCase>(CountApiKeysByApplicationIdUseCase);
    repository = module.get(IApiKeyRepository);
    isOwnerApplication = module.get(IsOwnerUseCase);
  });

  it('should return bad request if applicationId is not a valid UUID', async () => {
    const result = await useCase.execute('invalid-uuid', randomUUID());

    expect(result.isFailure).toBe(true);
    expect(result.status).toBe(400);
    expect(result.errors[0]).toBe('Application ID should be a valid UUID');
  });

  it('should return bad request if userId is not a valid UUID', async () => {
    const result = await useCase.execute(randomUUID(), 'invalid-uuid');

    expect(result.isFailure).toBe(true);
    expect(result.status).toBe(400);
    expect(result.errors[0]).toBe('User ID should be a valid UUID');
  });

  it('should return forbidden if user does not own the application', async () => {
    const applicationId = randomUUID();
    const userId = randomUUID();

    isOwnerApplication.execute.mockResolvedValue(Result.ok(false));

    const result = await useCase.execute(applicationId, userId);

    expect(result.isFailure).toBe(true);
    expect(result.status).toBe(403);
    expect(result.errors[0]).toBe('User does not have access to this application');
  });

  it('should return total count of API keys successfully', async () => {
    const applicationId = randomUUID();
    const userId = randomUUID();
    const totalKeys = 5;

    isOwnerApplication.execute.mockResolvedValue(Result.ok(true));
    repository.countByApplicationId.mockResolvedValue(totalKeys);

    const result = await useCase.execute(applicationId, userId);

    expect(result.isSuccess).toBe(true);
    expect(result.value).toBe(totalKeys);
    expect(repository.countByApplicationId).toHaveBeenCalledWith(applicationId);
  });
});
