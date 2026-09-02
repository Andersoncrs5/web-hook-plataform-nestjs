import { Test, TestingModule } from '@nestjs/testing';
import { InternalServerErrorException } from '@nestjs/common';
import { ExistsApiKeyByNameUseCase } from './exists-api-key-by-name.use-case.service';
import { IApiKeyRepository } from '../../repository/iapi-key.repository';

describe('ExistsApiKeyByNameUseCase', () => {
  let useCase: ExistsApiKeyByNameUseCase;
  let repository: jest.Mocked<IApiKeyRepository>;

  const validName = 'Production Key';

  beforeEach(async () => {
    const repositoryMock: Partial<jest.Mocked<IApiKeyRepository>> = {
      existsByName: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExistsApiKeyByNameUseCase,
        {
          provide: IApiKeyRepository,
          useValue: repositoryMock,
        },
      ],
    }).compile();

    useCase = module.get<ExistsApiKeyByNameUseCase>(ExistsApiKeyByNameUseCase);
    repository = module.get(IApiKeyRepository);
  });

  it('should be defined', () => {
    expect(useCase).toBeDefined();
  });

  it('should return badRequest if name is empty or whitespace', async () => {
    const result = await useCase.execute('   ');

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe('Name should be a non-empty string');
    expect(repository.existsByName).not.toHaveBeenCalled();
  });

  it('should return Result.ok(true) when api key name exists', async () => {
    repository.existsByName.mockResolvedValue(true);

    const result = await useCase.execute(validName);

    expect(repository.existsByName).toHaveBeenCalledWith(validName);
    expect(result.isSuccess).toBe(true);
    expect(result.value).toBe(true);
  });

  it('should return Result.ok(false) when api key name does not exist', async () => {
    repository.existsByName.mockResolvedValue(false);

    const result = await useCase.execute(validName);

    expect(repository.existsByName).toHaveBeenCalledWith(validName);
    expect(result.isSuccess).toBe(true);
    expect(result.value).toBe(false);
  });

  it('should throw InternalServerErrorException when repository fails', async () => {
    repository.existsByName.mockRejectedValue(new Error('Database error'));

    await expect(useCase.execute(validName)).rejects.toThrow(InternalServerErrorException);
  });
});
