import { Test, TestingModule } from '@nestjs/testing';
import { InternalServerErrorException } from '@nestjs/common';
import { FindAllApiKeysUseCase } from './find-all-api-keys.use-case.service';
import { IApiKeyRepository } from '../../repository/iapi-key.repository';
import { ApiKeyEntity } from '../../entities/api-key.entity';
import { Page, Pageable } from 'src/common/page/page';
import { ApiKeySort } from '../../dto/filter/api-key-sort.dto';
import { ApiKeyFilterDto } from '../../dto/filter/api-key.filter.dto';

describe('FindAllApiKeysUseCase', () => {
  let useCase: FindAllApiKeysUseCase;
  let repository: jest.Mocked<IApiKeyRepository>;

  const fakeApiKey: ApiKeyEntity = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    applicationId: 'app-uuid-123',
    createdBy: '987e6543-e21b-12d3-a456-426614174000',
    name: 'Test Key',
    keyHash: 'hash',
    keyPrefix: 'pk_live_1234',
    keyLastChars: '5678',
    environment: 'live' as any,
    enabled: true,
    version: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as ApiKeyEntity;

  const fakePage: Page<ApiKeyEntity> = new Page([fakeApiKey], 1, 10, 1);
  const filter: ApiKeyFilterDto = {};
  const pageable: Pageable<ApiKeySort> = new Pageable();

  beforeEach(async () => {
    const repositoryMock: Partial<jest.Mocked<IApiKeyRepository>> = {
      findAll: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindAllApiKeysUseCase,
        {
          provide: IApiKeyRepository,
          useValue: repositoryMock,
        },
      ],
    }).compile();

    useCase = module.get<FindAllApiKeysUseCase>(FindAllApiKeysUseCase);
    repository = module.get(IApiKeyRepository);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should return a page of api keys successfully', async () => {
    repository.findAll.mockResolvedValue(fakePage);

    const result = await useCase.execute(filter, pageable);

    expect(repository.findAll).toHaveBeenCalledWith(filter, pageable);
    expect(result.isSuccess).toBe(true);
    expect(result.value).toEqual(fakePage);
  });

  it('should throw InternalServerErrorException when repository fails', async () => {
    repository.findAll.mockRejectedValue(new Error('Database error'));

    await expect(useCase.execute(filter, pageable)).rejects.toThrow(InternalServerErrorException);
  });
});
