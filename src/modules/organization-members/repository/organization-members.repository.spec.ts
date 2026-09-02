import { INestApplication } from '@nestjs/common';
import { IOrganizationMemberRepository } from './iorganization-members.repository';
import { BaseTestHelper } from '../../../../test/helpers/integration-test.helper';
import { BaseIntegrationTest } from '../../../../test/helpers/base-test.helper';
import { OrganizationMemberStatusEnum } from 'src/common/enums/organizationMember/org.member';
import { Pageable, SortDirection } from 'src/common/page/page';
import { OrganizationMemberSort } from '../dto/filter/organization-member-sort.dto';

describe('OrganizationMemberRepository (Integration Test)', () => {
  let helperApp: BaseTestHelper;
  let app: INestApplication;
  let repository: IOrganizationMemberRepository;

  beforeAll(async () => {
    await BaseIntegrationTest.setupAll();

    app = BaseIntegrationTest.getApp();
    helperApp = new BaseTestHelper(app);

    repository = app.get<IOrganizationMemberRepository>(IOrganizationMemberRepository);
  }, 180000);

  afterAll(async () => {
    await BaseIntegrationTest.teardownAll();
  });

  it('should be defined', () => {
    expect(helperApp).toBeDefined();
    expect(app).toBeDefined();
    expect(repository).toBeDefined();
  });

  describe('create', () => {
    it('SUCCESS - should create an organization member', async () => {
      const user = await helperApp.createUser();
      const role = await helperApp.createRole();
      const org = await helperApp.createOrganization({ userId: user.id });

      const member = await helperApp.createOrgMember(user.id, role.id, org.id);

      expect(member).toBeDefined();
      expect(member.id).toBeDefined();
      expect(member.organizationId).toBe(org.id);
      expect(member.userId).toBe(user.id);
      expect(member.roleId).toBe(role.id);
      expect(member.status).toBe(OrganizationMemberStatusEnum.ACTIVE);
      expect(member.deletedAt).toBeNull();
    });
  });

  describe('existsByOrganizationIdAndUserId', () => {
    it('SUCCESS - should return true when member exists', async () => {
      const user = await helperApp.createUser();
      const role = await helperApp.createRole();
      const org = await helperApp.createOrganization({ userId: user.id });

      await helperApp.createOrgMember(user.id, role.id, org.id);

      const exists = await repository.existsByOrganizationIdAndUserId(org.id, user.id);

      expect(exists).toBe(true);
    });

    it('SUCCESS - should return false when member does not exist', async () => {
      const user = await helperApp.createUser();
      const org = await helperApp.createOrganization({ userId: user.id });

      const exists = await repository.existsByOrganizationIdAndUserId(org.id, user.id);

      expect(exists).toBe(false);
    });

    it('SUCCESS - should return false when member is soft-deleted', async () => {
      const user = await helperApp.createUser();
      const role = await helperApp.createRole();
      const org = await helperApp.createOrganization({ userId: user.id });

      await helperApp.createOrgMember(user.id, role.id, org.id, {
        deletedAt: new Date(),
      });

      const exists = await repository.existsByOrganizationIdAndUserId(org.id, user.id);

      expect(exists).toBe(false);
    });
  });

  describe('existsByOrganizationIdAndRoleId', () => {
    it('SUCCESS - should return true when member with role exists in organization', async () => {
      const user = await helperApp.createUser();
      const role = await helperApp.createRole();
      const org = await helperApp.createOrganization({ userId: user.id });

      await helperApp.createOrgMember(user.id, role.id, org.id);

      const exists = await repository.existsByOrganizationIdAndRoleId(org.id, role.id);

      expect(exists).toBe(true);
    });

    it('SUCCESS - should return false when role is not assigned in organization', async () => {
      const user = await helperApp.createUser();
      const role = await helperApp.createRole();
      const org = await helperApp.createOrganization({ userId: user.id });

      const exists = await repository.existsByOrganizationIdAndRoleId(org.id, role.id);

      expect(exists).toBe(false);
    });
  });

  describe('findAll', () => {
    it('SUCCESS - should return paginated list of members filtered by organizationId', async () => {
      const user1 = await helperApp.createUser();
      const user2 = await helperApp.createUser();
      const role = await helperApp.createRole();
      const org = await helperApp.createOrganization({ userId: user1.id });

      await helperApp.createOrgMember(user1.id, role.id, org.id);
      await helperApp.createOrgMember(user2.id, role.id, org.id);

      const pageable = new Pageable<OrganizationMemberSort>(
        1,
        10,
        OrganizationMemberSort.CREATED_AT,
        SortDirection.DESC,
      );

      const result = await repository.findAll({ organizationId: org.id }, pageable);

      expect(result.content).toHaveLength(2);
      expect(result.totalElements).toBe(2);
      expect(result.page).toBe(1);
      expect(result.size).toBe(10);
    });

    it('SUCCESS - should filter members by status', async () => {
      const user1 = await helperApp.createUser();
      const user2 = await helperApp.createUser();
      const role = await helperApp.createRole();
      const org = await helperApp.createOrganization({ userId: user1.id });

      await helperApp.createOrgMember(user1.id, role.id, org.id, {
        status: OrganizationMemberStatusEnum.ACTIVE,
      });
      await helperApp.createOrgMember(user2.id, role.id, org.id, {
        status: OrganizationMemberStatusEnum.SUSPENDED,
      });

      const pageable = new Pageable<OrganizationMemberSort>(
        1,
        10,
        OrganizationMemberSort.CREATED_AT,
        SortDirection.DESC,
      );

      const result = await repository.findAll(
        {
          organizationId: org.id,
          status: [OrganizationMemberStatusEnum.SUSPENDED],
        },
        pageable,
      );

      expect(result.content).toHaveLength(1);
      expect(result.content[0].userId).toBe(user2.id);
      expect(result.content[0].status).toBe(OrganizationMemberStatusEnum.SUSPENDED);
    });

    it('SUCCESS - should not return soft-deleted members', async () => {
      const user = await helperApp.createUser();
      const role = await helperApp.createRole();
      const org = await helperApp.createOrganization({ userId: user.id });

      await helperApp.createOrgMember(user.id, role.id, org.id, {
        deletedAt: new Date(),
      });

      const pageable = new Pageable<OrganizationMemberSort>(
        1,
        10,
        OrganizationMemberSort.CREATED_AT,
        SortDirection.DESC,
      );

      const result = await repository.findAll({ organizationId: org.id }, pageable);

      expect(result.content).toHaveLength(0);
      expect(result.totalElements).toBe(0);
    });
  });
});
