import { HttpStatus, INestApplication } from '@nestjs/common';
import { BaseIntegrationTest } from '../../../../test/helpers/base-test.helper';
import { BaseTestHelper } from '../../../../test/helpers/integration-test.helper';
import request from 'supertest';
import { randomUUID } from 'crypto';
import { ResponseHTTP } from 'src/utils/http/responseHttp.res';
import { CreateOrganizationDto } from '../dto/request/create-organization.dto';
import { UpdateOrganizationDto } from '../dto/request/update-organization.dto';
import { OrganizationDTO } from '../dto/response/organization.dto';

describe('OrganizationsController (Integration Test)', () => {
  let app: INestApplication;
  let helper: BaseTestHelper;

  const path = '/v1/organizations';

  beforeAll(async () => {
    await BaseIntegrationTest.setupAll();

    app = BaseIntegrationTest.getApp();
    helper = new BaseTestHelper(app);
  }, 180000);

  afterAll(async () => {
    await BaseIntegrationTest.teardownAll();
  });

  describe('POST /v1/organizations', () => {
    it('should create organization successfully', async () => {
      const { tokens } = await helper.createUserHTTP();
      const key = helper.getRandomString(8);
      const idempotencyKey = randomUUID();

      const dto: CreateOrganizationDto = {
        name: `Org ${key}`,
        slug: `org-${key.toLowerCase()}`,
        metadata: { description: 'Test Organization' },
      };

      const res = await request(app.getHttpServer())
        .post(path)
        .set('x-idempotency-key', idempotencyKey)
        .set('Authorization', `Bearer ${tokens.token}`)
        .send(dto);

      expect(res.status).toBe(HttpStatus.CREATED);

      const response = res.body as ResponseHTTP<OrganizationDTO>;

      expect(response).toMatchObject({
        status: true,
        method: 'POST',
        path: path,
      });

      expect(response.timestamp).toBeDefined();
      expect(response.traceId).toBeDefined();
      expect(response.traceId).toBe(idempotencyKey);
      expect(response.body).toMatchObject({
        name: dto.name,
        slug: dto.slug,
      });
    });

    it('should return 409 Conflict when organization name already exists', async () => {
      const { tokens } = await helper.createUserHTTP();
      const existingOrg = await helper.createOrganization({
        userId: tokens.user.id,
      });
      const idempotencyKey = randomUUID();

      const dto: CreateOrganizationDto = {
        name: existingOrg.name,
        slug: `org-unique-${helper.getRandomString(6).toLowerCase()}`,
      };

      const res = await request(app.getHttpServer())
        .post(path)
        .set('x-idempotency-key', idempotencyKey)
        .set('Authorization', `Bearer ${tokens.token}`)
        .send(dto);

      expect(res.status).toBe(HttpStatus.CONFLICT);

      const response = res.body as ResponseHTTP<null>;

      expect(response).toMatchObject({
        status: false,
        method: 'POST',
        path: path,
        body: null,
      });

      expect(response.message).toBe(`Name: '${dto.name}' already exists`);
      expect(response.timestamp).toBeDefined();
      expect(response.traceId).toBeDefined();
    });

    it('should return 409 Conflict when organization slug already exists', async () => {
      const { tokens } = await helper.createUserHTTP();
      const existingOrg = await helper.createOrganization({
        userId: tokens.user.id,
      });
      const idempotencyKey = randomUUID();

      const dto: CreateOrganizationDto = {
        name: `Unique Name ${helper.getRandomString(6)}`,
        slug: existingOrg.slug,
      };

      const res = await request(app.getHttpServer())
        .post(path)
        .set('x-idempotency-key', idempotencyKey)
        .set('Authorization', `Bearer ${tokens.token}`)
        .send(dto);

      expect(res.status).toBe(HttpStatus.CONFLICT);

      const response = res.body as ResponseHTTP<null>;

      expect(response).toMatchObject({
        status: false,
        method: 'POST',
        path: path,
        body: null,
      });

      expect(response.message).toBe(`Slug: '${dto.slug}' already exists`);
      expect(response.timestamp).toBeDefined();

      expect(response.traceId).toBeDefined();
      expect(response.traceId).toBe(idempotencyKey);
    });

    it('should return 400 Bad Request when validation fails', async () => {
      const { tokens } = await helper.createUserHTTP();
      const idempotencyKey = randomUUID();

      const dto = {
        name: '',
        slug: 'INVALID SLUG!',
      };

      const res = await request(app.getHttpServer())
        .post(path)
        .set('x-idempotency-key', idempotencyKey)
        .set('Authorization', `Bearer ${tokens.token}`)
        .send(dto);

      expect(res.status).toBe(HttpStatus.BAD_REQUEST);

      const response = res.body as ResponseHTTP<null>;

      expect(response).toMatchObject({
        status: false,
        method: 'POST',
        path: path,
        body: null,
      });

      expect(response.timestamp).toBeDefined();

      expect(response.traceId).toBeDefined();
      expect(response.traceId).toBe(idempotencyKey);
    });

    it('should return 401 Unauthorized when authorization header is missing', async () => {
      const idempotencyKey = randomUUID();

      const dto: CreateOrganizationDto = {
        name: 'Org Without Auth',
        slug: 'org-no-auth',
      };

      const res = await request(app.getHttpServer()).post(path).send(dto);

      expect(res.status).toBe(HttpStatus.UNAUTHORIZED);

      const response = res.body as ResponseHTTP<null>;

      expect(response.status).toBe(false);
      expect(response.method).toBe('POST');
      expect(response.path).toBe(path);
      expect(response.body).toBeNull();
      expect(response.message).toBe('Token not found');
      expect(response.timestamp).toBeDefined();

      expect(response.traceId).toBeDefined();
    });

    it('should return 401 Unauthorized when token is invalid', async () => {
      const dto: CreateOrganizationDto = {
        name: 'Org Invalid Token',
        slug: 'org-invalid-token',
      };

      const res = await request(app.getHttpServer())
        .post(path)
        .set('Authorization', 'Bearer invalid-token')
        .send(dto);

      expect(res.status).toBe(HttpStatus.UNAUTHORIZED);

      const response = res.body as ResponseHTTP<null>;

      expect(response.status).toBe(false);
      expect(response.method).toBe('POST');
      expect(response.path).toBe(path);
      expect(response.body).toBeNull();
      expect(response.message).toBe('Token invalid or expired');
      expect(response.timestamp).toBeDefined();
      expect(response.traceId).toBeDefined();
    });
  });

  describe('GET /v1/organizations/:id', () => {
    it('should find organization by id successfully', async () => {
      const { tokens } = await helper.createUserHTTP();
      const idempotencyKey = randomUUID();
      const existingOrg = await helper.createOrganization({
        userId: tokens.user.id,
      });

      const res = await request(app.getHttpServer())
        .get(`${path}/${existingOrg.id}`)
        .set('x-idempotency-key', idempotencyKey)
        .set('Authorization', `Bearer ${tokens.token}`);

      expect(res.status).toBe(HttpStatus.OK);

      const response = res.body as ResponseHTTP<OrganizationDTO>;

      expect(response).toMatchObject({
        status: true,
        method: 'GET',
        path: `${path}/${existingOrg.id}`,
      });

      expect(response.timestamp).toBeDefined();

      expect(response.traceId).toBeDefined();
      expect(response.traceId).toBe(idempotencyKey);

      expect(response.body).toMatchObject({
        id: existingOrg.id,
        name: existingOrg.name,
        slug: existingOrg.slug,
      });
    });

    it('should return 404 Not Found when organization does not exist', async () => {
      const { tokens } = await helper.createUserHTTP();
      const nonExistentId = randomUUID();
      const idempotencyKey = randomUUID();

      const res = await request(app.getHttpServer())
        .get(`${path}/${nonExistentId}`)
        .set('x-idempotency-key', idempotencyKey)
        .set('Authorization', `Bearer ${tokens.token}`);

      expect(res.status).toBe(HttpStatus.NOT_FOUND);

      const response = res.body as ResponseHTTP<null>;

      expect(response).toMatchObject({
        status: false,
        method: 'GET',
        path: `${path}/${nonExistentId}`,
        body: null,
      });

      expect(response.timestamp).toBeDefined();
      expect(response.traceId).toBeDefined();
      expect(response.traceId).toBe(idempotencyKey);
    });

    it('should return 401 Unauthorized when authorization header is missing', async () => {
      const nonExistentId = randomUUID();
      const idempotencyKey = randomUUID();

      const res = await request(app.getHttpServer())
        .get(`${path}/${nonExistentId}`)
        .set('x-idempotency-key', idempotencyKey);

      expect(res.status).toBe(HttpStatus.UNAUTHORIZED);

      const response = res.body as ResponseHTTP<null>;

      expect(response).toMatchObject({
        status: false,
        method: 'GET',
        path: `${path}/${nonExistentId}`,
        body: null,
        message: 'Token not found',
      });

      expect(response.timestamp).toBeDefined();
      expect(response.traceId).toBeDefined();
      expect(response.traceId).toBe(idempotencyKey);
    });

    it('should return 401 Unauthorized when token is invalid', async () => {
      const nonExistentId = randomUUID();
      const idempotencyKey = randomUUID();

      const res = await request(app.getHttpServer())
        .get(`${path}/${nonExistentId}`)
        .set('x-idempotency-key', idempotencyKey)
        .set('Authorization', 'Bearer invalid-token');

      expect(res.status).toBe(HttpStatus.UNAUTHORIZED);

      const response = res.body as ResponseHTTP<null>;

      expect(response).toMatchObject({
        status: false,
        method: 'GET',
        path: `${path}/${nonExistentId}`,
        body: null,
        message: 'Token invalid or expired',
      });

      expect(response.timestamp).toBeDefined();
      expect(response.traceId).toBeDefined();
      expect(response.traceId).toBe(idempotencyKey);
    });
  });

  describe('DELETE /v1/organizations/:id', () => {
    it('should delete organization successfully when user is the owner', async () => {
      const { tokens } = await helper.createUserHTTP();
      const existingOrg = await helper.createOrganization({
        userId: tokens.user.id,
      });
      const idempotencyKey = randomUUID();

      const res = await request(app.getHttpServer())
        .delete(`${path}/${existingOrg.id}`)
        .set('x-idempotency-key', idempotencyKey)
        .set('Authorization', `Bearer ${tokens.token}`);

      expect(res.status).toBe(HttpStatus.OK);
    });

    it('should return 403 Forbidden when user does not own the organization', async () => {
      const owner = await helper.createUserHTTP();
      const nonOwner = await helper.createUserHTTP();
      const existingOrg = await helper.createOrganization({
        userId: owner.tokens.user.id,
      });
      const idempotencyKey = randomUUID();

      const res = await request(app.getHttpServer())
        .delete(`${path}/${existingOrg.id}`)
        .set('x-idempotency-key', idempotencyKey)
        .set('Authorization', `Bearer ${nonOwner.tokens.token}`);

      expect(res.status).toBe(HttpStatus.FORBIDDEN);

      const response = res.body as ResponseHTTP<null>;

      expect(response).toMatchObject({
        status: false,
        method: 'DELETE',
        path: `${path}/${existingOrg.id}`,
        body: null,
        message: 'You do not own this organization',
      });

      expect(response.timestamp).toBeDefined();
      expect(response.traceId).toBeDefined();
    });

    it('should return 400 Bad Request when id is not a valid UUID', async () => {
      const { tokens } = await helper.createUserHTTP();
      const invalidId = 'invalid-uuid-123';
      const idempotencyKey = randomUUID();

      const res = await request(app.getHttpServer())
        .delete(`${path}/${invalidId}`)
        .set('x-idempotency-key', idempotencyKey)
        .set('Authorization', `Bearer ${tokens.token}`);

      expect(res.status).toBe(HttpStatus.BAD_REQUEST);

      const response = res.body as ResponseHTTP<null>;

      expect(response).toMatchObject({
        status: false,
        method: 'DELETE',
        path: `${path}/${invalidId}`,
        body: null,
        message: 'Id should be a UUID',
      });

      expect(response.timestamp).toBeDefined();
      expect(response.traceId).toBeDefined();
    });

    it('should return 404 Not Found when organization does not exist', async () => {
      const { tokens } = await helper.createUserHTTP();
      const nonExistentId = randomUUID();
      const idempotencyKey = randomUUID();

      const res = await request(app.getHttpServer())
        .delete(`${path}/${nonExistentId}`)
        .set('x-idempotency-key', idempotencyKey)
        .set('Authorization', `Bearer ${tokens.token}`);

      expect(res.status).toBe(HttpStatus.NOT_FOUND);

      const response = res.body as ResponseHTTP<null>;

      expect(response).toMatchObject({
        status: false,
        method: 'DELETE',
        path: `${path}/${nonExistentId}`,
        body: null,
        message: 'Organization not found',
      });

      expect(response.timestamp).toBeDefined();
      expect(response.traceId).toBeDefined();
    });

    it('should return 401 Unauthorized when authorization header is missing', async () => {
      const targetId = randomUUID();

      const res = await request(app.getHttpServer()).delete(
        `${path}/${targetId}`,
      );

      expect(res.status).toBe(HttpStatus.UNAUTHORIZED);

      const response = res.body as ResponseHTTP<null>;

      expect(response).toMatchObject({
        status: false,
        method: 'DELETE',
        path: `${path}/${targetId}`,
        body: null,
        message: 'Token not found',
      });

      expect(response.timestamp).toBeDefined();
      expect(response.traceId).toBeDefined();
    });

    it('should return 401 Unauthorized when token is invalid', async () => {
      const targetId = randomUUID();

      const res = await request(app.getHttpServer())
        .delete(`${path}/${targetId}`)
        .set('Authorization', 'Bearer invalid-token');

      expect(res.status).toBe(HttpStatus.UNAUTHORIZED);

      const response = res.body as ResponseHTTP<null>;

      expect(response).toMatchObject({
        status: false,
        method: 'DELETE',
        path: `${path}/${targetId}`,
        body: null,
        message: 'Token invalid or expired',
      });

      expect(response.timestamp).toBeDefined();
      expect(response.traceId).toBeDefined();
    });
  });

  describe('PATCH /v1/organizations/:id', () => {
    it('should update organization successfully', async () => {
      const { tokens } = await helper.createUserHTTP();
      const existingOrg = await helper.createOrganization({
        userId: tokens.user.id,
      });
      const idempotencyKey = randomUUID();
      const newKey = helper.getRandomString(6);

      const dto: UpdateOrganizationDto = {
        name: `Updated Org ${newKey}`,
        slug: `updated-org-${newKey.toLowerCase()}`,
      };

      const res = await request(app.getHttpServer())
        .patch(`${path}/${existingOrg.id}`)
        .set('x-idempotency-key', idempotencyKey)
        .set('Authorization', `Bearer ${tokens.token}`)
        .send(dto);

      expect(res.status).toBe(HttpStatus.OK);

      const response = res.body as ResponseHTTP<OrganizationDTO>;

      expect(response).toMatchObject({
        status: true,
        method: 'PATCH',
        path: `${path}/${existingOrg.id}`,
      });

      expect(response.timestamp).toBeDefined();
      expect(response.traceId).toBeDefined();
      expect(response.traceId).toBe(idempotencyKey);
      expect(response.body).toMatchObject({
        id: existingOrg.id,
        name: dto.name,
        slug: dto.slug,
      });
    });

    it('should return 409 Conflict when updated organization name already exists', async () => {
      const { tokens } = await helper.createUserHTTP();
      const org1 = await helper.createOrganization({ userId: tokens.user.id });
      const org2 = await helper.createOrganization({ userId: tokens.user.id });
      const idempotencyKey = randomUUID();

      const dto: UpdateOrganizationDto = {
        name: org1.name,
      };

      const res = await request(app.getHttpServer())
        .patch(`${path}/${org2.id}`)
        .set('x-idempotency-key', idempotencyKey)
        .set('Authorization', `Bearer ${tokens.token}`)
        .send(dto);

      expect(res.status).toBe(HttpStatus.CONFLICT);

      const response = res.body as ResponseHTTP<null>;

      expect(response).toMatchObject({
        status: false,
        method: 'PATCH',
        path: `${path}/${org2.id}`,
        body: null,
      });

      expect(response.message).toBe(`Name: '${dto.name}' already exists`);
      expect(response.timestamp).toBeDefined();
      expect(response.traceId).toBeDefined();
    });

    it('should return 409 Conflict when updated organization slug already exists', async () => {
      const { tokens } = await helper.createUserHTTP();
      const org1 = await helper.createOrganization({ userId: tokens.user.id });
      const org2 = await helper.createOrganization({ userId: tokens.user.id });
      const idempotencyKey = randomUUID();

      const dto: UpdateOrganizationDto = {
        slug: org1.slug,
      };

      const res = await request(app.getHttpServer())
        .patch(`${path}/${org2.id}`)
        .set('x-idempotency-key', idempotencyKey)
        .set('Authorization', `Bearer ${tokens.token}`)
        .send(dto);

      expect(res.status).toBe(HttpStatus.CONFLICT);

      const response = res.body as ResponseHTTP<null>;

      expect(response).toMatchObject({
        status: false,
        method: 'PATCH',
        path: `${path}/${org2.id}`,
        body: null,
      });

      expect(response.message).toBe(`Slug: '${dto.slug}' already exists`);
      expect(response.timestamp).toBeDefined();
      expect(response.traceId).toBeDefined();
    });

    it('should return 400 Bad Request when id is not a valid UUID', async () => {
      const { tokens } = await helper.createUserHTTP();
      const invalidId = 'invalid-uuid-123';
      const idempotencyKey = randomUUID();

      const dto: UpdateOrganizationDto = {
        name: 'Updated Name',
      };

      const res = await request(app.getHttpServer())
        .patch(`${path}/${invalidId}`)
        .set('x-idempotency-key', idempotencyKey)
        .set('Authorization', `Bearer ${tokens.token}`)
        .send(dto);

      expect(res.status).toBe(HttpStatus.BAD_REQUEST);

      const response = res.body as ResponseHTTP<null>;

      expect(response).toMatchObject({
        status: false,
        method: 'PATCH',
        path: `${path}/${invalidId}`,
        body: null,
        message: 'Id should be a UUID',
      });

      expect(response.timestamp).toBeDefined();
      expect(response.traceId).toBeDefined();
    });

    it('should return 404 Not Found when organization does not exist', async () => {
      const { tokens } = await helper.createUserHTTP();
      const nonExistentId = randomUUID();
      const idempotencyKey = randomUUID();

      const dto: UpdateOrganizationDto = {
        name: 'New Name',
      };

      const res = await request(app.getHttpServer())
        .patch(`${path}/${nonExistentId}`)
        .set('x-idempotency-key', idempotencyKey)
        .set('Authorization', `Bearer ${tokens.token}`)
        .send(dto);

      expect(res.status).toBe(HttpStatus.NOT_FOUND);

      const response = res.body as ResponseHTTP<null>;

      expect(response).toMatchObject({
        status: false,
        method: 'PATCH',
        path: `${path}/${nonExistentId}`,
        body: null,
        message: 'Organization not found',
      });

      expect(response.timestamp).toBeDefined();
      expect(response.traceId).toBeDefined();
    });

    it('should return 401 Unauthorized when authorization header is missing', async () => {
      const targetId = randomUUID();

      const dto: UpdateOrganizationDto = {
        name: 'Updated Name',
      };

      const res = await request(app.getHttpServer())
        .patch(`${path}/${targetId}`)
        .send(dto);

      expect(res.status).toBe(HttpStatus.UNAUTHORIZED);

      const response = res.body as ResponseHTTP<null>;

      expect(response).toMatchObject({
        status: false,
        method: 'PATCH',
        path: `${path}/${targetId}`,
        body: null,
        message: 'Token not found',
      });

      expect(response.timestamp).toBeDefined();
      expect(response.traceId).toBeDefined();
    });

    it('should return 401 Unauthorized when token is invalid', async () => {
      const targetId = randomUUID();

      const dto: UpdateOrganizationDto = {
        name: 'Updated Name',
      };

      const res = await request(app.getHttpServer())
        .patch(`${path}/${targetId}`)
        .set('Authorization', 'Bearer invalid-token')
        .send(dto);

      expect(res.status).toBe(HttpStatus.UNAUTHORIZED);

      const response = res.body as ResponseHTTP<null>;

      expect(response).toMatchObject({
        status: false,
        method: 'PATCH',
        path: `${path}/${targetId}`,
        body: null,
        message: 'Token invalid or expired',
      });

      expect(response.timestamp).toBeDefined();
      expect(response.traceId).toBeDefined();
    });
  });

  describe('GET /v1/organizations/exists/name/:name', () => {
    it('should return true when organization name already exists', async () => {
      const { tokens } = await helper.createUserHTTP();
      const existingOrg = await helper.createOrganization({
        userId: tokens.user.id,
      });
      const idempotencyKey = randomUUID();

      const res = await request(app.getHttpServer())
        .get(`${path}/exists/name/${encodeURIComponent(existingOrg.name)}`)
        .set('x-idempotency-key', idempotencyKey)
        .set('Authorization', `Bearer ${tokens.token}`);

      expect(res.status).toBe(HttpStatus.OK);

      const response = res.body as ResponseHTTP<boolean>;

      expect(response).toMatchObject({
        status: true,
        method: 'GET',
        path: `${path}/exists/name/${encodeURIComponent(existingOrg.name)}`,
        body: true,
      });

      expect(response.timestamp).toBeDefined();
      expect(response.traceId).toBeDefined();
      expect(response.traceId).toBe(idempotencyKey);
    });

    it('should return false when organization name does not exist', async () => {
      const { tokens } = await helper.createUserHTTP();
      const nonExistentName = `Non Existent Name ${helper.getRandomString(8)}`;
      const idempotencyKey = randomUUID();

      const res = await request(app.getHttpServer())
        .get(`${path}/exists/name/${encodeURIComponent(nonExistentName)}`)
        .set('x-idempotency-key', idempotencyKey)
        .set('Authorization', `Bearer ${tokens.token}`);

      expect(res.status).toBe(HttpStatus.OK);

      const response = res.body as ResponseHTTP<boolean>;

      expect(response).toMatchObject({
        status: true,
        method: 'GET',
        path: `${path}/exists/name/${encodeURIComponent(nonExistentName)}`,
        body: false,
      });

      expect(response.timestamp).toBeDefined();
      expect(response.traceId).toBeDefined();
      expect(response.traceId).toBe(idempotencyKey);
    });
  });

  describe('GET /v1/organizations/exists/slug/:slug', () => {
    it('should return true when organization slug already exists', async () => {
      const { tokens } = await helper.createUserHTTP();
      const existingOrg = await helper.createOrganization({
        userId: tokens.user.id,
      });
      const idempotencyKey = randomUUID();

      const res = await request(app.getHttpServer())
        .get(`${path}/exists/slug/${existingOrg.slug}`)
        .set('x-idempotency-key', idempotencyKey)
        .set('Authorization', `Bearer ${tokens.token}`);

      expect(res.status).toBe(HttpStatus.OK);

      const response = res.body as ResponseHTTP<boolean>;

      expect(response).toMatchObject({
        status: true,
        method: 'GET',
        path: `${path}/exists/slug/${existingOrg.slug}`,
        body: true,
      });

      expect(response.timestamp).toBeDefined();
      expect(response.traceId).toBeDefined();
      expect(response.traceId).toBe(idempotencyKey);
    });

    it('should return false when organization slug does not exist', async () => {
      const { tokens } = await helper.createUserHTTP();
      const nonExistentSlug = `non-existent-slug-${helper.getRandomString(8).toLowerCase()}`;
      const idempotencyKey = randomUUID();

      const res = await request(app.getHttpServer())
        .get(`${path}/exists/slug/${nonExistentSlug}`)
        .set('x-idempotency-key', idempotencyKey)
        .set('Authorization', `Bearer ${tokens.token}`);

      expect(res.status).toBe(HttpStatus.OK);

      const response = res.body as ResponseHTTP<boolean>;

      expect(response).toMatchObject({
        status: true,
        method: 'GET',
        path: `${path}/exists/slug/${nonExistentSlug}`,
        body: false,
      });

      expect(response.timestamp).toBeDefined();
      expect(response.traceId).toBeDefined();
      expect(response.traceId).toBe(idempotencyKey);
    });
  });

  describe('GET /v1/organizations', () => {
    it('should return a paginated list of organizations', async () => {
      const { tokens } = await helper.createUserHTTP();
      await helper.createOrganization({ userId: tokens.user.id });
      const idempotencyKey = randomUUID();

      const res = await request(app.getHttpServer())
        .get(path)
        .query({ page: 0, size: 10 })
        .set('x-idempotency-key', idempotencyKey)
        .set('Authorization', `Bearer ${tokens.token}`);

      expect(res.status).toBe(HttpStatus.OK);
      expect(res.body).toBeDefined();
    });

    it('should return 401 Unauthorized when authorization header is missing', async () => {
      const idempotencyKey = randomUUID();

      const res = await request(app.getHttpServer())
        .get(path)
        .set('x-idempotency-key', idempotencyKey);

      expect(res.status).toBe(HttpStatus.UNAUTHORIZED);

      const response = res.body as ResponseHTTP<null>;

      expect(response).toMatchObject({
        status: false,
        method: 'GET',
        path: path,
        body: null,
        message: 'Token not found',
      });

      expect(response.timestamp).toBeDefined();
      expect(response.traceId).toBeDefined();
      expect(response.traceId).toBe(idempotencyKey);
    });

    it('should return 401 Unauthorized when token is invalid', async () => {
      const idempotencyKey = randomUUID();

      const res = await request(app.getHttpServer())
        .get(path)
        .set('x-idempotency-key', idempotencyKey)
        .set('Authorization', 'Bearer invalid-token');

      expect(res.status).toBe(HttpStatus.UNAUTHORIZED);

      const response = res.body as ResponseHTTP<null>;

      expect(response).toMatchObject({
        status: false,
        method: 'GET',
        path: path,
        body: null,
        message: 'Token invalid or expired',
      });

      expect(response.timestamp).toBeDefined();
      expect(response.traceId).toBeDefined();
      expect(response.traceId).toBe(idempotencyKey);
    });
  });
});
