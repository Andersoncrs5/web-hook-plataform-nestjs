import { INestApplication } from '@nestjs/common';

import { BaseIntegrationTest } from '../../../../test/helpers/base-test.helper';
import { BaseTestHelper } from '../../../../test/helpers/integration-test.helper';

import { ApiKeyRepository } from './api-key.repository';
import { Pageable, SortDirection } from 'src/common/page/page';

import { ApiKeyFilterDto } from '../dto/filter/api-key.filter.dto';
import { ApiKeySort } from '../dto/filter/api-key-sort.dto';

import { ApiKeyEnvironmentEnum } from 'src/common/enums/apiKeys/api-keys.enums';

describe('ApiKeyRepository (Integration Test)', () => {
  let app: INestApplication;
  let helper: BaseTestHelper;
  let repository: ApiKeyRepository;

  beforeAll(async () => {
    await BaseIntegrationTest.setupAll();

    app = BaseIntegrationTest.getApp();

    helper = new BaseTestHelper(app);

    repository = app.get<ApiKeyRepository>(ApiKeyRepository);
  }, 180000);

  it('should be defined', () => {
    expect(helper).toBeDefined();
    expect(app).toBeDefined();
    expect(repository).toBeDefined();
  });

  beforeEach(async () => {
    await helper.apiKeyRepository.deleteAll();
  });

  // =========================================================
  // COUNT BY APPLICATION ID
  // =========================================================

  describe('countByApplicationId', () => {
    it('should return the correct count of active api keys for a given application', async () => {
      const application = await helper.createFakeApplication();

      await helper.createFakeApiKey(application.createdBy!, application.id);
      await helper.createFakeApiKey(application.createdBy!, application.id);

      const count = await repository.countByApplicationId(application.id);

      expect(count).toBe(2);
    });

    it('should return 0 when the application has no api keys', async () => {
      const application = await helper.createFakeApplication();

      const count = await repository.countByApplicationId(application.id);

      expect(count).toBe(0);
    });

    it('should not include deleted api keys in the count', async () => {
      const application = await helper.createFakeApplication();

      const apiKey1 = await helper.createFakeApiKey(application.createdBy!, application.id);
      const apiKey2 = await helper.createFakeApiKey(application.createdBy!, application.id);

      await repository.deleteById(apiKey1.id);

      const count = await repository.countByApplicationId(application.id);

      expect(count).toBe(1);
    });

    it('should only count api keys belonging to the specified application', async () => {
      const application1 = await helper.createFakeApplication();
      const application2 = await helper.createFakeApplication();

      await helper.createFakeApiKey(application1.createdBy!, application1.id);
      await helper.createFakeApiKey(application2.createdBy!, application2.id);

      const countApp1 = await repository.countByApplicationId(application1.id);
      const countApp2 = await repository.countByApplicationId(application2.id);

      expect(countApp1).toBe(1);
      expect(countApp2).toBe(1);
    });
  });

  // =========================================================
  // FIND BY KEY HASH
  // =========================================================

  describe('findByKeyHash', () => {
    it('should return the api key entity when matching keyHash exists', async () => {
      const application = await helper.createFakeApplication();
      const createdKey = await helper.createFakeApiKey(application.createdBy!, application.id);

      const result = await repository.findByKeyHash(createdKey.keyHash);

      expect(result).toBeDefined();
      expect(result).not.toBeNull();
      expect(result?.id).toBe(createdKey.id);
      expect(result?.keyHash).toBe(createdKey.keyHash);
      expect(result?.applicationId).toBe(application.id);
    });

    it('should return null when keyHash does not exist', async () => {
      const nonExistentKeyHash = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

      const result = await repository.findByKeyHash(nonExistentKeyHash);

      expect(result).toBeNull();
    });

    it('should return null if the api key with matching keyHash is soft-deleted', async () => {
      const application = await helper.createFakeApplication();
      const createdKey = await helper.createFakeApiKey(application.createdBy!, application.id);

      await repository.deleteById(createdKey.id);

      const result = await repository.findByKeyHash(createdKey.keyHash);

      expect(result).toBeNull();
    });
  });

  // =========================================================
  // CREATE
  // =========================================================

  describe('create', () => {
    it('should create a new api key successfully', async () => {
      const application = await helper.createFakeApplication();

      const apiKey = await helper.createFakeApiKey(application.createdBy!, application.id);

      expect(apiKey).toBeDefined();

      expect(apiKey.id).toBeDefined();
      expect(apiKey.applicationId).toBe(application.id);
      expect(apiKey.createdBy).toBe(application.createdBy);

      expect(apiKey.name).toBeDefined();
      expect(apiKey.keyHash).toBeDefined();
      expect(apiKey.keyPrefix).toBeDefined();
      expect(apiKey.keyLastChars).toBeDefined();

      expect(apiKey.environment).toBe(ApiKeyEnvironmentEnum.TEST);

      expect(apiKey.enabled).toBe(true);
      expect(apiKey.version).toBe(0);

      expect(apiKey.createdAt).toBeDefined();
      expect(apiKey.updatedAt).toBeDefined();

      await repository.deleteById(apiKey.id);
    });
  });

  // =========================================================
  // FIND BY ID
  // =========================================================

  describe('findById', () => {
    it('should return an api key when id exists', async () => {
      const user = await helper.createUser();
      const application = await helper.createFakeApplication({ createdBy: user.id });

      const apiKey = await helper.createFakeApiKey(application.createdBy!, application.id);

      const found = await repository.findById(apiKey.id);

      expect(found).not.toBeNull();

      expect(found?.id).toBe(apiKey.id);
      expect(found?.applicationId).toBe(application.id);
      expect(found?.createdBy).toBe(application.createdBy);
      expect(found?.name).toBe(apiKey.name);
      expect(found?.environment).toBe(apiKey.environment);
      expect(found?.enabled).toBe(true);

      await repository.deleteById(apiKey.id);
    });

    it('should return null when api key does not exist', async () => {
      const nonExistentId = helper.generateUuid();

      const found = await repository.findById(nonExistentId);

      expect(found).toBeNull();
    });
  });

  // =========================================================
  // FIND ALL
  // =========================================================

  describe('findAll', () => {
    it('should return all api keys when filter is empty', async () => {
      const user = await helper.createUser();
      const application1 = await helper.createFakeApplication({ createdBy: user.id });

      const application2 = await helper.createFakeApplication({ createdBy: user.id });

      const apiKey1 = await helper.createFakeApiKey(application1.createdBy!, application1.id);

      const apiKey2 = await helper.createFakeApiKey(application2.createdBy!, application2.id);

      const page = await repository.findAll({} as ApiKeyFilterDto, {
        page: 1,
        size: 10,
        sortBy: ApiKeySort.CREATED_AT,
        direction: SortDirection.ASC,
      });

      expect(page).toBeDefined();
      expect(page.content.length).toBe(2);
      expect(page.totalElements).toBe(2);

      const ids = page.content.map((item) => item.id).sort();

      expect(ids).toEqual([apiKey1.id, apiKey2.id].sort());

      await repository.deleteById(apiKey1.id);
      await repository.deleteById(apiKey2.id);
    });

    it('should filter by id', async () => {
      const user = await helper.createUser();

      const application1 = await helper.createFakeApplication({ createdBy: user.id });
      const application2 = await helper.createFakeApplication({ createdBy: user.id });

      const apiKey1 = await helper.createFakeApiKey(application1.createdBy!, application1.id);
      const apiKey2 = await helper.createFakeApiKey(application2.createdBy!, application2.id);

      const page = await repository.findAll(
        {
          id: apiKey1.id,
        } as ApiKeyFilterDto,
        {
          page: 1,
          size: 10,
          sortBy: ApiKeySort.CREATED_AT,
          direction: SortDirection.ASC,
        },
      );

      expect(page.totalElements).toBe(1);
      expect(page.content.length).toBe(1);
      expect(page.content[0].id).toBe(apiKey1.id);

      await repository.deleteById(apiKey1.id);
      await repository.deleteById(apiKey2.id);
    });

    it('should filter by applicationId', async () => {
      const user = await helper.createUser();
      const application = await helper.createFakeApplication({ createdBy: user.id });

      const apiKey1 = await helper.createFakeApiKey(application.createdBy!, application.id);

      const apiKey2 = await helper.createFakeApiKey(application.createdBy!, application.id);

      const otherApplication = await helper.createFakeApplication({ createdBy: user.id });

      const other = await helper.createFakeApiKey(otherApplication.createdBy!, otherApplication.id);

      const page = await repository.findAll(
        {
          applicationId: application.id,
        } as ApiKeyFilterDto,
        {
          page: 1,
          size: 10,
          sortBy: ApiKeySort.CREATED_AT,
          direction: SortDirection.ASC,
        },
      );

      expect(page.totalElements).toBe(2);
      expect(page.content.length).toBe(2);

      expect(page.content.every((item) => item.applicationId === application.id)).toBe(true);

      await repository.deleteById(apiKey1.id);
      await repository.deleteById(apiKey2.id);
      await repository.deleteById(other.id);
    });

    it('should filter by name ignoring case', async () => {
      const user = await helper.createUser();
      const application = await helper.createFakeApplication({ createdBy: user.id });

      const name = `Production Key ${helper.getRandomString(8)}`;

      const target = await helper.createFakeApiKey(application.createdBy!, application.id, {
        name,
      });

      const other = await helper.createFakeApiKey(application.createdBy!, application.id);

      const page = await repository.findAll(
        {
          name: name.toUpperCase(),
        } as ApiKeyFilterDto,
        {
          page: 1,
          size: 10,
          sortBy: ApiKeySort.NAME,
          direction: SortDirection.ASC,
        },
      );

      expect(page.totalElements).toBe(1);
      expect(page.content.length).toBe(1);
      expect(page.content[0].id).toBe(target.id);

      await repository.deleteById(target.id);
      await repository.deleteById(other.id);
    });

    it('should filter by environment', async () => {
      const user = await helper.createUser();
      const application = await helper.createFakeApplication({ createdBy: user.id });

      const testKey = await helper.createFakeApiKey(application.createdBy!, application.id, {
        environment: ApiKeyEnvironmentEnum.TEST,
      });

      const liveKey = await helper.createFakeApiKey(application.createdBy!, application.id, {
        environment: ApiKeyEnvironmentEnum.LIVE,
      });

      const page = await repository.findAll(
        {
          environment: [ApiKeyEnvironmentEnum.TEST],
        } as ApiKeyFilterDto,
        {
          page: 1,
          size: 10,
          sortBy: ApiKeySort.ENVIRONMENT,
          direction: SortDirection.ASC,
        },
      );

      expect(page.totalElements).toBe(1);
      expect(page.content.length).toBe(1);
      expect(page.content[0].id).toBe(testKey.id);

      await repository.deleteById(testKey.id);
      await repository.deleteById(liveKey.id);
    });

    it('should filter by enabled', async () => {
      const user = await helper.createUser();

      const application = await helper.createFakeApplication({ createdBy: user.id });

      const enabled = await helper.createFakeApiKey(application.createdBy!, application.id, {
        enabled: true,
      });

      const disabled = await helper.createFakeApiKey(application.createdBy!, application.id, {
        enabled: false,
      });

      const page = await repository.findAll(
        {
          enabled: false,
        } as ApiKeyFilterDto,
        {
          page: 1,
          size: 10,
          sortBy: ApiKeySort.ENABLED,
          direction: SortDirection.ASC,
        },
      );

      expect(page.totalElements).toBe(1);
      expect(page.content.length).toBe(1);
      expect(page.content[0].id).toBe(disabled.id);
      expect(page.content[0].enabled).toBe(false);

      await repository.deleteById(enabled.id);
      await repository.deleteById(disabled.id);
    });

    it('should filter by version', async () => {
      const user = await helper.createUser();
      const application = await helper.createFakeApplication({ createdBy: user.id });

      const apiKey = await helper.createFakeApiKey(application.createdBy!, application.id);

      const updated = await repository.update({
        ...apiKey,
        name: `${apiKey.name}_updated`,
      });

      expect(updated.version).toBe(1);

      const page = await repository.findAll(
        {
          version: 1,
        } as ApiKeyFilterDto,
        {
          page: 1,
          size: 10,
          sortBy: ApiKeySort.VERSION,
          direction: SortDirection.ASC,
        },
      );

      expect(page.totalElements).toBe(1);
      expect(page.content[0].id).toBe(apiKey.id);
      expect(page.content[0].version).toBe(1);

      await repository.deleteById(apiKey.id);
    });

    it('should filter by createdAt range', async () => {
      const user = await helper.createUser();
      const application = await helper.createFakeApplication({ createdBy: user.id });

      const targetCreatedAt = new Date('2026-06-01T00:00:00.000Z');

      const apiKey = await helper.createFakeApiKey(application.createdBy!, application.id, {
        createdAt: targetCreatedAt,
        updatedAt: targetCreatedAt,
      });

      const page = await repository.findAll(
        {
          createdAtMin: new Date('2026-01-01T00:00:00.000Z'),
          createdAtMax: new Date('2026-12-31T23:59:59.999Z'),
        } as ApiKeyFilterDto,
        {
          page: 1,
          size: 10,
          sortBy: ApiKeySort.CREATED_AT,
          direction: SortDirection.ASC,
        },
      );

      expect(page.totalElements).toBe(1);
      expect(page.content[0].id).toBe(apiKey.id);

      await repository.deleteById(apiKey.id);
    });

    it('should paginate results', async () => {
      const user = await helper.createUser();

      const application = await helper.createFakeApplication({ createdBy: user.id });

      const apiKey1 = await helper.createFakeApiKey(application.createdBy!, application.id);

      const apiKey2 = await helper.createFakeApiKey(application.createdBy!, application.id);

      const apiKey3 = await helper.createFakeApiKey(application.createdBy!, application.id);

      const page = await repository.findAll({} as ApiKeyFilterDto, {
        page: 1,
        size: 2,
        sortBy: ApiKeySort.CREATED_AT,
        direction: SortDirection.ASC,
      });

      expect(page.content.length).toBe(2);
      expect(page.totalElements).toBe(3);
      expect(page.page).toBe(1);
      expect(page.size).toBe(2);

      await repository.deleteById(apiKey1.id);
      await repository.deleteById(apiKey2.id);
      await repository.deleteById(apiKey3.id);
    });

    it('should return empty page when there are no matches', async () => {
      const page = await repository.findAll(
        {
          name: `does-not-exist-${helper.getRandomString(12)}`,
        } as ApiKeyFilterDto,
        {
          page: 1,
          size: 10,
          sortBy: ApiKeySort.NAME,
          direction: SortDirection.ASC,
        },
      );

      expect(page).toBeDefined();
      expect(page.content).toEqual([]);
      expect(page.totalElements).toBe(0);
    });

    it('should sort by name ascending', async () => {
      const user = await helper.createUser();

      const application = await helper.createFakeApplication({ createdBy: user.id });

      const apiKeyA = await helper.createFakeApiKey(application.createdBy!, application.id, {
        name: `AAA_${helper.getRandomString(8)}`,
      });

      const apiKeyB = await helper.createFakeApiKey(application.createdBy!, application.id, {
        name: `ZZZ_${helper.getRandomString(8)}`,
      });

      const page = await repository.findAll({} as ApiKeyFilterDto, {
        page: 1,
        size: 10,
        sortBy: ApiKeySort.NAME,
        direction: SortDirection.ASC,
      });

      const indexA = page.content.findIndex((item) => item.id === apiKeyA.id);

      const indexB = page.content.findIndex((item) => item.id === apiKeyB.id);

      expect(indexA).toBeLessThan(indexB);

      await repository.deleteById(apiKeyA.id);
      await repository.deleteById(apiKeyB.id);
    });

    it('should sort by name descending', async () => {
      const user = await helper.createUser();
      const application = await helper.createFakeApplication({ createdBy: user.id });

      const apiKeyA = await helper.createFakeApiKey(application.createdBy!, application.id, {
        name: `AAA_${helper.getRandomString(8)}`,
      });

      const apiKeyB = await helper.createFakeApiKey(application.createdBy!, application.id, {
        name: `ZZZ_${helper.getRandomString(8)}`,
      });

      const page = await repository.findAll({} as ApiKeyFilterDto, {
        page: 1,
        size: 10,
        sortBy: ApiKeySort.NAME,
        direction: SortDirection.DESC,
      });

      const indexA = page.content.findIndex((item) => item.id === apiKeyA.id);

      const indexB = page.content.findIndex((item) => item.id === apiKeyB.id);

      expect(indexB).toBeLessThan(indexA);

      await repository.deleteById(apiKeyA.id);
      await repository.deleteById(apiKeyB.id);
    });

    it('should support ascending and descending sorting by createdAt', async () => {
      const user = await helper.createUser();

      const application = await helper.createFakeApplication({ createdBy: user.id });

      const older = await helper.createFakeApiKey(application.createdBy!, application.id, {
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      });

      const newer = await helper.createFakeApiKey(application.createdBy!, application.id, {
        createdAt: new Date('2026-07-01T00:00:00.000Z'),
      });

      const ascPage = await repository.findAll({} as ApiKeyFilterDto, {
        page: 1,
        size: 10,
        sortBy: ApiKeySort.CREATED_AT,
        direction: SortDirection.ASC,
      });

      const ascOlder = ascPage.content.findIndex((item) => item.id === older.id);

      const ascNewer = ascPage.content.findIndex((item) => item.id === newer.id);

      expect(ascOlder).toBeLessThan(ascNewer);

      const descPage = await repository.findAll({} as ApiKeyFilterDto, {
        page: 1,
        size: 10,
        sortBy: ApiKeySort.CREATED_AT,
        direction: SortDirection.DESC,
      });

      const descOlder = descPage.content.findIndex((item) => item.id === older.id);

      const descNewer = descPage.content.findIndex((item) => item.id === newer.id);

      expect(descNewer).toBeLessThan(descOlder);

      await repository.deleteById(older.id);
      await repository.deleteById(newer.id);
    });
  });

  // =========================================================
  // FIND ALL BY APPLICATION ID
  // =========================================================

  describe('findAllByApplicationId', () => {
    it('should return api keys belonging to an application', async () => {
      const user = await helper.createUser();

      const application = await helper.createFakeApplication({ createdBy: user.id });

      const apiKey1 = await helper.createFakeApiKey(application.createdBy!, application.id);

      const apiKey2 = await helper.createFakeApiKey(application.createdBy!, application.id);

      const otherApplication = await helper.createFakeApplication({ createdBy: user.id });

      const other = await helper.createFakeApiKey(otherApplication.createdBy!, otherApplication.id);

      const result = await repository.findAllByApplicationId(application.id);

      expect(result).toHaveLength(2);

      expect(result.every((item) => item.applicationId === application.id)).toBe(true);

      await repository.deleteById(apiKey1.id);
      await repository.deleteById(apiKey2.id);
      await repository.deleteById(other.id);
    });

    it('should respect the limit', async () => {
      const user = await helper.createUser();
      const application = await helper.createFakeApplication({ createdBy: user.id });

      const apiKey1 = await helper.createFakeApiKey(application.createdBy!, application.id);

      const apiKey2 = await helper.createFakeApiKey(application.createdBy!, application.id);

      const apiKey3 = await helper.createFakeApiKey(application.createdBy!, application.id);

      const result = await repository.findAllByApplicationId(application.id, 2);

      expect(result).toHaveLength(2);

      await repository.deleteById(apiKey1.id);
      await repository.deleteById(apiKey2.id);
      await repository.deleteById(apiKey3.id);
    });

    it('should not return deleted api keys', async () => {
      const user = await helper.createUser();
      const application = await helper.createFakeApplication({ createdBy: user.id });

      const apiKey1 = await helper.createFakeApiKey(application.createdBy!, application.id);

      const apiKey2 = await helper.createFakeApiKey(application.createdBy!, application.id);

      await repository.deleteById(apiKey2.id);

      const result = await repository.findAllByApplicationId(application.id);

      expect(result.some((item) => item.id === apiKey2.id)).toBe(false);

      await repository.deleteById(apiKey1.id);
    });
  });

  // =========================================================
  // EXISTS BY NAME
  // =========================================================

  describe('existsByName', () => {
    it('should return true when api key exists', async () => {
      const user = await helper.createUser();
      const application = await helper.createFakeApplication({ createdBy: user.id });

      const apiKey = await helper.createFakeApiKey(application.createdBy!, application.id);

      const exists = await repository.existsByName(apiKey.name);

      expect(exists).toBe(true);

      await repository.deleteById(apiKey.id);
    });

    it('should be case-insensitive', async () => {
      const user = await helper.createUser();
      const application = await helper.createFakeApplication({ createdBy: user.id });

      const apiKey = await helper.createFakeApiKey(application.createdBy!, application.id, {
        name: `Production_${helper.getRandomString(10)}`,
      });

      const exists = await repository.existsByName(apiKey.name.toUpperCase());

      expect(exists).toBe(true);

      await repository.deleteById(apiKey.id);
    });

    it('should return false when api key does not exist', async () => {
      const exists = await repository.existsByName(`nonexistent_${helper.getRandomString(12)}`);

      expect(exists).toBe(false);
    });

    it('should return false for a deleted api key', async () => {
      const user = await helper.createUser();
      const application = await helper.createFakeApplication({ createdBy: user.id });

      const apiKey = await helper.createFakeApiKey(application.createdBy!, application.id);

      await repository.deleteById(apiKey.id);

      const exists = await repository.existsByName(apiKey.name);

      expect(exists).toBe(false);
    });
  });

  // =========================================================
  // DELETE
  // =========================================================

  describe('deleteById', () => {
    it('should delete api key and return true', async () => {
      const user = await helper.createUser();
      const application = await helper.createFakeApplication({ createdBy: user.id });

      const apiKey = await helper.createFakeApiKey(application.createdBy!, application.id);

      const deleted = await repository.deleteById(apiKey.id);

      expect(deleted).toBe(true);

      const found = await repository.findById(apiKey.id);

      expect(found).toBeNull();
    });

    it('should return false when api key does not exist', async () => {
      const nonExistentId = helper.generateUuid();

      const deleted = await repository.deleteById(nonExistentId);

      expect(deleted).toBe(false);
    });
  });
});
