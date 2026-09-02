import { INestApplication } from '@nestjs/common';
import { BaseIntegrationTest } from '../../../../test/helpers/base-test.helper';
import { BaseTestHelper } from '../../../../test/helpers/integration-test.helper';
import { ApplicationEntity } from '../entities/application.entity';
import { IApplicationRepository } from '../repository/iapplication.repository';

describe('ApplicationRepository (Integration Test)', () => {
  let helperApp: BaseTestHelper;
  let app: INestApplication;
  let repository: IApplicationRepository;

  const createdApplicationIds: string[] = [];

  const trackApplication = (application: ApplicationEntity): ApplicationEntity => {
    createdApplicationIds.push(application.id);
    return application;
  };

  beforeAll(async () => {
    await BaseIntegrationTest.setupAll();

    app = BaseIntegrationTest.getApp();
    helperApp = new BaseTestHelper(app);

    repository = app.get<IApplicationRepository>(IApplicationRepository);
  }, 180000);

  afterEach(async () => {
    if (!repository) {
      createdApplicationIds.length = 0;
      return;
    }

    const ids = [...createdApplicationIds].reverse();
    createdApplicationIds.length = 0;

    for (const id of ids) {
      try {
        await repository.deleteById(id);
      } catch {
        // Silencia exceções durante a limpeza do banco
      }
    }
  });

  afterAll(async () => {
    await BaseIntegrationTest.teardownAll();
  });

  it('should be defined', () => {
    expect(helperApp).toBeDefined();
    expect(app).toBeDefined();
    expect(repository).toBeDefined();
  });

  describe('isOwner', () => {
    it('should return true when user is the owner of the application', async () => {
      const { user } = await helperApp.createUserHTTP();
      const org = await helperApp.createOrganization({ userId: user.id });
      const createdApp = trackApplication(
        await helperApp.createFakeApplication({
          organizationId: org.id,
          createdBy: user.id,
        }),
      );

      const isOwner = await repository.isOwner(createdApp.id, user.id);

      expect(isOwner).toBe(true);
    });

    it('should return false when user is not the owner of the application', async () => {
      const { user: owner } = await helperApp.createUserHTTP();
      const { user: otherUser } = await helperApp.createUserHTTP();
      const org = await helperApp.createOrganization({ userId: owner.id });
      const createdApp = trackApplication(
        await helperApp.createFakeApplication({
          organizationId: org.id,
          createdBy: owner.id,
        }),
      );

      const isOwner = await repository.isOwner(createdApp.id, otherUser.id);

      expect(isOwner).toBe(false);
    });

    it('should return false when application does not exist', async () => {
      const { user } = await helperApp.createUserHTTP();
      const nonExistentAppId = helperApp.generateUuid();

      const isOwner = await repository.isOwner(nonExistentAppId, user.id);

      expect(isOwner).toBe(false);
    });
  });

  describe('create', () => {
    it('should create a new application successfully', async () => {
      const { user } = await helperApp.createUserHTTP();
      const org = await helperApp.createOrganization({ userId: user.id });

      const createdApp = trackApplication(
        await helperApp.createFakeApplication({
          organizationId: org.id,
          createdBy: user.id,
        }),
      );

      expect(createdApp).toBeDefined();
      expect(createdApp.id).toBeDefined();
      expect(createdApp.organizationId).toBe(org.id);
      expect(createdApp.createdBy).toBe(user.id);
      expect(createdApp.version).toBe(0);
      expect(createdApp.createdAt).toBeDefined();
      expect(createdApp.updatedAt).toBeDefined();
    });
  });

  describe('findById', () => {
    it('should return an application when id exists', async () => {
      const { user } = await helperApp.createUserHTTP();
      const org = await helperApp.createOrganization({ userId: user.id });
      const createdApp = trackApplication(
        await helperApp.createFakeApplication({
          organizationId: org.id,
          createdBy: user.id,
        }),
      );

      const foundApp = await repository.findById(createdApp.id);

      expect(foundApp).not.toBeNull();
      expect(foundApp?.id).toBe(createdApp.id);
      expect(foundApp?.name).toBe(createdApp.name);
      expect(foundApp?.slug).toBe(createdApp.slug);
    });

    it('should return null when application id does not exist', async () => {
      const nonExistentId = helperApp.generateUuid();

      const foundApp = await repository.findById(nonExistentId);

      expect(foundApp).toBeNull();
    });
  });

  describe('existsById', () => {
    it('should return true if application exists by id', async () => {
      const { user } = await helperApp.createUserHTTP();
      const org = await helperApp.createOrganization({ userId: user.id });
      const createdApp = trackApplication(
        await helperApp.createFakeApplication({
          organizationId: org.id,
          createdBy: user.id,
        }),
      );

      const exists = await repository.existsById(createdApp.id);

      expect(exists).toBe(true);
    });

    it('should return false if application does not exist by id', async () => {
      const nonExistentId = helperApp.generateUuid();

      const exists = await repository.existsById(nonExistentId);

      expect(exists).toBe(false);
    });
  });

  describe('existsByName', () => {
    it('should return true if application exists by name', async () => {
      const { user } = await helperApp.createUserHTTP();
      const org = await helperApp.createOrganization({ userId: user.id });
      const createdApp = trackApplication(
        await helperApp.createFakeApplication({
          organizationId: org.id,
          createdBy: user.id,
        }),
      );

      const exists = await repository.existsByName(createdApp.name);

      expect(exists).toBe(true);
    });

    it('should return true when checking name case-insensitively', async () => {
      const { user } = await helperApp.createUserHTTP();
      const org = await helperApp.createOrganization({ userId: user.id });
      const createdApp = trackApplication(
        await helperApp.createFakeApplication({
          organizationId: org.id,
          createdBy: user.id,
        }),
      );

      const exists = await repository.existsByName(createdApp.name.toUpperCase());

      expect(exists).toBe(true);
    });

    it('should return false if application does not exist by name', async () => {
      const nonExistentName = `non_existent_app_${helperApp.getRandomString(8)}`;

      const exists = await repository.existsByName(nonExistentName);

      expect(exists).toBe(false);
    });
  });

  describe('existsBySlug', () => {
    it('should return true if application exists by slug', async () => {
      const { user } = await helperApp.createUserHTTP();
      const org = await helperApp.createOrganization({ userId: user.id });
      const createdApp = trackApplication(
        await helperApp.createFakeApplication({
          organizationId: org.id,
          createdBy: user.id,
        }),
      );

      const exists = await repository.existsBySlug(createdApp.slug);

      expect(exists).toBe(true);
    });

    it('should return true when checking slug case-insensitively', async () => {
      const { user } = await helperApp.createUserHTTP();
      const org = await helperApp.createOrganization({ userId: user.id });
      const createdApp = trackApplication(
        await helperApp.createFakeApplication({
          organizationId: org.id,
          createdBy: user.id,
        }),
      );

      const exists = await repository.existsBySlug(createdApp.slug.toUpperCase());

      expect(exists).toBe(true);
    });

    it('should return false if application does not exist by slug', async () => {
      const nonExistentSlug = `non-existent-slug-${helperApp.getRandomString(8)}`;

      const exists = await repository.existsBySlug(nonExistentSlug);

      expect(exists).toBe(false);
    });
  });

  describe('update', () => {
    it('should update application data and increment version', async () => {
      const { user } = await helperApp.createUserHTTP();
      const org = await helperApp.createOrganization({ userId: user.id });
      const createdApp = trackApplication(
        await helperApp.createFakeApplication({
          organizationId: org.id,
          createdBy: user.id,
        }),
      );

      const beforeUpdate = new Date();

      const updateData: ApplicationEntity = {
        ...createdApp,
        name: `Updated App ${helperApp.getRandomString(5)}`,
        description: 'Updated Description',
      };

      const updatedApp = await repository.update(updateData);

      expect(updatedApp).toBeDefined();
      expect(updatedApp.id).toBe(createdApp.id);
      expect(updatedApp.name).toBe(updateData.name);
      expect(updatedApp.description).toBe('Updated Description');
      expect(updatedApp.version).toBe(createdApp.version + 1);
      expect(new Date(updatedApp.updatedAt).getTime()).toBeGreaterThanOrEqual(
        beforeUpdate.getTime(),
      );
    });
  });

  describe('deleteById', () => {
    it('should delete application by id and return true', async () => {
      const { user } = await helperApp.createUserHTTP();
      const org = await helperApp.createOrganization({ userId: user.id });
      const createdApp = trackApplication(
        await helperApp.createFakeApplication({
          organizationId: org.id,
          createdBy: user.id,
        }),
      );

      const deleted = await repository.deleteById(createdApp.id);
      const foundApp = await repository.findById(createdApp.id);

      expect(deleted).toBe(true);
      expect(foundApp).toBeNull();
    });

    it('should return false when deleting non-existent application', async () => {
      const nonExistentId = helperApp.generateUuid();

      const deleted = await repository.deleteById(nonExistentId);

      expect(deleted).toBe(false);
    });
  });

  describe('deleteByIdAndCount', () => {
    it('should delete application and return deleted count 1', async () => {
      const { user } = await helperApp.createUserHTTP();
      const org = await helperApp.createOrganization({ userId: user.id });
      const createdApp = trackApplication(
        await helperApp.createFakeApplication({
          organizationId: org.id,
          createdBy: user.id,
        }),
      );

      const count = await repository.deleteByIdAndCount(createdApp.id);
      const foundApp = await repository.findById(createdApp.id);

      expect(count).toBe(1);
      expect(foundApp).toBeNull();
    });

    it('should return 0 when deleting non-existent application', async () => {
      const nonExistentId = helperApp.generateUuid();

      const count = await repository.deleteByIdAndCount(nonExistentId);

      expect(count).toBe(0);
    });
  });
});
