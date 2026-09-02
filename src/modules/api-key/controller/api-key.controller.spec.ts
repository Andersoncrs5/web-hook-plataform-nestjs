import { HttpStatus, INestApplication } from '@nestjs/common';

import request from 'supertest';
import { randomUUID } from 'node:crypto';

import { BaseIntegrationTest } from '../../../../test/helpers/base-test.helper';
import { BaseTestHelper } from '../../../../test/helpers/integration-test.helper';

import { CreateApiKeyDto } from '../dto/request/create-api-key.dto';
import { ApiKeyDto } from '../dto/response/api-key.dto';

import { ApiKeyEnvironmentEnum } from 'src/common/enums/apiKeys/api-keys.enums';

import { ResponseHTTP } from 'src/utils/http/responseHttp.res';
import { Page } from 'src/common/page/page';

describe('ApiKeyController (Integration Test)', () => {
  let app: INestApplication;
  let helper: BaseTestHelper;

  const pathMain = '/v1/api-key';

  beforeAll(async () => {
    await BaseIntegrationTest.setupAll();

    app = BaseIntegrationTest.getApp();
    helper = new BaseTestHelper(app);
  }, 180000);

  afterAll(async () => {
    await BaseIntegrationTest.teardownAll();
  });

  describe('POST /v1/api-key', () => {
    it('should create an API key successfully', async () => {
      const { userId, tokens } = await helper.createUserHTTP();

      const organization = await helper.createOrganization({
        userId,
      });

      const application = await helper.createApplicationHTTP(organization.id, tokens.token);

      const key = helper.getRandomString(20);

      const dto: CreateApiKeyDto = {
        applicationId: application.id,
        name: `API Key ${key}`,
        environment: ApiKeyEnvironmentEnum.LIVE,
        enabled: true,
      };

      const idempotencyKey = randomUUID();

      const res = await request(app.getHttpServer())
        .post(pathMain)
        .set('x-idempotency-key', idempotencyKey)
        .set('Authorization', `Bearer ${tokens.token}`)
        .send(dto);

      expect(res.status).toBe(HttpStatus.CREATED);

      const response = res.body as ResponseHTTP<{
        apiKey: ApiKeyDto;
        key: string;
      }>;

      expect(response).toMatchObject({
        status: true,
        method: 'POST',
        path: pathMain,
      });

      expect(response.traceId).toBeDefined();

      expect(response.traceId).toBe(idempotencyKey);

      expect(response.timestamp).toBeDefined();

      expect(response.body).toBeDefined();

      expect(response.body.apiKey).toBeDefined();

      expect(response.body.apiKey.id).toBeDefined();

      expect(response.body.apiKey.applicationId).toBe(application.id);

      expect(response.body.apiKey.name).toBe(dto.name);

      expect(response.body.apiKey.environment).toBe(ApiKeyEnvironmentEnum.LIVE);

      expect(response.body.apiKey.enabled).toBe(true);

      expect(response.body.key).toBeDefined();

      expect(response.body.key).not.toBe('');

      expect(response.body.key).toMatch(/^pk_live_/);
    });

    it('should use LIVE environment when environment is not provided', async () => {
      const { userId, tokens } = await helper.createUserHTTP();

      const organization = await helper.createOrganization({
        userId,
      });

      const application = await helper.createApplicationHTTP(organization.id, tokens.token);

      const key = helper.getRandomString(20);

      const dto: CreateApiKeyDto = {
        applicationId: application.id,
        name: `API Key ${key}`,
        enabled: true,
      };

      const idempotencyKey = randomUUID();

      const res = await request(app.getHttpServer())
        .post(pathMain)
        .set('x-idempotency-key', idempotencyKey)
        .set('Authorization', `Bearer ${tokens.token}`)
        .send(dto);

      expect(res.status).toBe(HttpStatus.CREATED);

      const response = res.body as ResponseHTTP<{
        apiKey: ApiKeyDto;
        key: string;
      }>;

      expect(response.traceId).toBe(idempotencyKey);

      expect(response.body.apiKey.environment).toBe(ApiKeyEnvironmentEnum.LIVE);

      expect(response.body.key).toMatch(/^pk_live_/);
    });

    it('should return 403 when user does not own the application', async () => {
      const owner = await helper.createUserHTTP();

      const organization = await helper.createOrganization({
        userId: owner.userId,
      });

      const application = await helper.createApplicationHTTP(organization.id, owner.tokens.token);

      const otherUser = await helper.createUserHTTP();

      const dto: CreateApiKeyDto = {
        applicationId: application.id,
        name: `API Key ${helper.getRandomString(20)}`,
        environment: ApiKeyEnvironmentEnum.LIVE,
        enabled: true,
      };

      const idempotencyKey = randomUUID();

      const res = await request(app.getHttpServer())
        .post(pathMain)
        .set('x-idempotency-key', idempotencyKey)
        .set('Authorization', `Bearer ${otherUser.tokens.token}`)
        .send(dto);

      expect(res.status).toBe(HttpStatus.FORBIDDEN);

      const response = res.body as ResponseHTTP<any>;

      expect(response).toMatchObject({
        status: false,
        method: 'POST',
        path: pathMain,
      });

      expect(response.traceId).toBe(idempotencyKey);

      expect(response.timestamp).toBeDefined();
    });

    it('should return 400 when applicationId is not a valid UUID', async () => {
      const { tokens } = await helper.createUserHTTP();

      const dto: CreateApiKeyDto = {
        applicationId: 'invalid-uuid',
        name: `API Key ${helper.getRandomString(20)}`,
        environment: ApiKeyEnvironmentEnum.LIVE,
        enabled: true,
      };

      const idempotencyKey = randomUUID();

      const res = await request(app.getHttpServer())
        .post(pathMain)
        .set('x-idempotency-key', idempotencyKey)
        .set('Authorization', `Bearer ${tokens.token}`)
        .send(dto);

      expect(res.status).toBe(HttpStatus.BAD_REQUEST);

      const response = res.body as ResponseHTTP<any>;

      expect(response).toMatchObject({
        status: false,
        method: 'POST',
        path: pathMain,
      });

      expect(response.traceId).toBe(idempotencyKey);

      expect(response.timestamp).toBeDefined();
    });

    it('should return 409 when API key name already exists for the application', async () => {
      const { userId, tokens } = await helper.createUserHTTP();

      const organization = await helper.createOrganization({
        userId,
      });

      const application = await helper.createApplicationHTTP(organization.id, tokens.token);

      const name = `API Key ${helper.getRandomString(20)}`;

      const firstDto: CreateApiKeyDto = {
        applicationId: application.id,
        name,
        environment: ApiKeyEnvironmentEnum.LIVE,
        enabled: true,
      };

      const firstIdempotencyKey = randomUUID();

      const firstResponse = await request(app.getHttpServer())
        .post(pathMain)
        .set('x-idempotency-key', firstIdempotencyKey)
        .set('Authorization', `Bearer ${tokens.token}`)
        .send(firstDto);

      expect(firstResponse.status).toBe(HttpStatus.CREATED);

      const secondIdempotencyKey = randomUUID();

      const secondResponse = await request(app.getHttpServer())
        .post(pathMain)
        .set('x-idempotency-key', secondIdempotencyKey)
        .set('Authorization', `Bearer ${tokens.token}`)
        .send(firstDto);

      expect(secondResponse.status).toBe(HttpStatus.CONFLICT);

      const response = secondResponse.body as ResponseHTTP<any>;

      expect(response).toMatchObject({
        status: false,
        method: 'POST',
        path: pathMain,
      });

      expect(response.traceId).toBe(secondIdempotencyKey);

      expect(response.timestamp).toBeDefined();

      expect(response.message).toContain('already exists');
    });

    it('should create a disabled API key when enabled is false', async () => {
      const { userId, tokens } = await helper.createUserHTTP();

      const organization = await helper.createOrganization({
        userId,
      });

      const application = await helper.createApplicationHTTP(organization.id, tokens.token);

      const dto: CreateApiKeyDto = {
        applicationId: application.id,
        name: `API Key ${helper.getRandomString(20)}`,
        environment: ApiKeyEnvironmentEnum.TEST,
        enabled: false,
      };

      const idempotencyKey = randomUUID();

      const res = await request(app.getHttpServer())
        .post(pathMain)
        .set('x-idempotency-key', idempotencyKey)
        .set('Authorization', `Bearer ${tokens.token}`)
        .send(dto);

      expect(res.status).toBe(HttpStatus.CREATED);

      const response = res.body as ResponseHTTP<{
        apiKey: ApiKeyDto;
        key: string;
      }>;

      expect(response.traceId).toBe(idempotencyKey);

      expect(response.body.apiKey.enabled).toBe(false);

      expect(response.body.apiKey.environment).toBe(ApiKeyEnvironmentEnum.TEST);

      expect(response.body.key).toMatch(/^pk_test_/);
    });
  });

  describe('PATCH /v1/api-key/:id/rotate', () => {
    it('should rotate API key successfully and return new raw key', async () => {
      const { userId, tokens } = await helper.createUserHTTP();

      const organization = await helper.createOrganization({
        userId,
      });

      const application = await helper.createApplicationHTTP(organization.id, tokens.token);

      const createdKey = await helper.createApiKeyHTTP(application.id, tokens.token);

      const idempotencyKey = randomUUID();
      const path = `${pathMain}/${createdKey.apiKey.id}/rotate`;

      const res = await request(app.getHttpServer())
        .patch(path)
        .set('x-idempotency-key', idempotencyKey)
        .set('Authorization', `Bearer ${tokens.token}`);

      expect(res.status).toBe(HttpStatus.OK);

      const response = res.body as ResponseHTTP<{
        apiKey: ApiKeyDto;
        key: string;
      }>;

      expect(response).toMatchObject({
        status: true,
        method: 'PATCH',
        path,
      });

      expect(response.traceId).toBe(idempotencyKey);
      expect(response.timestamp).toBeDefined();

      expect(response.body).toBeDefined();
      expect(response.body.apiKey).toBeDefined();
      expect(response.body.apiKey.id).toBe(createdKey.apiKey.id);
      expect(response.body.key).toBeDefined();
      expect(response.body.key).not.toBe('');
      expect(response.body.key).toMatch(/^pk_live_/);
    });

    it('should return 404 when API key ID does not exist', async () => {
      const { tokens } = await helper.createUserHTTP();

      const nonExistentId = randomUUID();
      const idempotencyKey = randomUUID();
      const path = `${pathMain}/${nonExistentId}/rotate`;

      const res = await request(app.getHttpServer())
        .patch(path)
        .set('x-idempotency-key', idempotencyKey)
        .set('Authorization', `Bearer ${tokens.token}`);

      expect(res.status).toBe(HttpStatus.NOT_FOUND);

      const response = res.body as ResponseHTTP<any>;

      expect(response).toMatchObject({
        status: false,
        method: 'PATCH',
        path,
      });

      expect(response.traceId).toBe(idempotencyKey);
    });

    it('should return 400 when API key ID is an invalid UUID', async () => {
      const { tokens } = await helper.createUserHTTP();

      const invalidId = 'invalid-uuid';
      const idempotencyKey = randomUUID();
      const path = `${pathMain}/${invalidId}/rotate`;

      const res = await request(app.getHttpServer())
        .patch(path)
        .set('x-idempotency-key', idempotencyKey)
        .set('Authorization', `Bearer ${tokens.token}`);

      expect(res.status).toBe(HttpStatus.BAD_REQUEST);

      const response = res.body as ResponseHTTP<any>;

      expect(response.traceId).toBe(idempotencyKey);
    });

    it('should return 403 when user does not own the application of the API key', async () => {
      const owner = await helper.createUserHTTP();
      const organization = await helper.createOrganization({ userId: owner.userId });
      const application = await helper.createApplicationHTTP(organization.id, owner.tokens.token);
      const createdKey = await helper.createApiKeyHTTP(application.id, owner.tokens.token);

      const otherUser = await helper.createUserHTTP();

      const idempotencyKey = randomUUID();
      const path = `${pathMain}/${createdKey.apiKey.id}/rotate`;

      const res = await request(app.getHttpServer())
        .patch(path)
        .set('x-idempotency-key', idempotencyKey)
        .set('Authorization', `Bearer ${otherUser.tokens.token}`);

      expect(res.status).toBe(HttpStatus.FORBIDDEN);

      const response = res.body as ResponseHTTP<any>;

      expect(response).toMatchObject({
        status: false,
        method: 'PATCH',
        path,
      });

      expect(response.traceId).toBe(idempotencyKey);
    });
  });

  describe('GET exists', () => {
    describe('GET /v1/api-key/exists/name/:name', () => {
      it('should return true when api key exists by name', async () => {
        const { userId, tokens } = await helper.createUserHTTP();
        const organization = await helper.createOrganization({ userId });
        const application = await helper.createApplicationHTTP(organization.id, tokens.token);

        const created = await helper.createApiKeyHTTP(application.id, tokens.token);

        const idempotencyKey = randomUUID();

        const res = await request(app.getHttpServer())
          .get(`${pathMain}/exists/name/${encodeURIComponent(created.apiKey.name)}`)
          .set('x-idempotency-key', idempotencyKey)
          .set('Authorization', `Bearer ${tokens.token}`);

        expect(res.status).toBe(HttpStatus.OK);

        const response = res.body as ResponseHTTP<boolean>;

        expect(response.status).toBe(true);
        expect(response.method).toBe('GET');
        expect(response.path).toBe(
          `${pathMain}/exists/name/${encodeURIComponent(created.apiKey.name)}`,
        );
        expect(response.traceId).toBeDefined();
        expect(response.traceId).toBe(idempotencyKey);
        expect(response.timestamp).toBeDefined();
        expect(response.body).toBe(true);
      });

      it('should return false when api key does not exist by name', async () => {
        const { tokens } = await helper.createUserHTTP();

        const name = `non-existing-${helper.getRandomString(20)}`;
        const idempotencyKey = randomUUID();

        const res = await request(app.getHttpServer())
          .get(`${pathMain}/exists/name/${encodeURIComponent(name)}`)
          .set('x-idempotency-key', idempotencyKey)
          .set('Authorization', `Bearer ${tokens.token}`);

        expect(res.status).toBe(HttpStatus.OK);

        const response = res.body as ResponseHTTP<boolean>;

        expect(response.status).toBe(true);
        expect(response.method).toBe('GET');
        expect(response.path).toBe(`${pathMain}/exists/name/${encodeURIComponent(name)}`);
        expect(response.traceId).toBeDefined();
        expect(response.traceId).toBe(idempotencyKey);
        expect(response.timestamp).toBeDefined();
        expect(response.body).toBe(false);
      });

      it('should return 400 when name is empty', async () => {
        const { tokens } = await helper.createUserHTTP();

        const idempotencyKey = randomUUID();

        const res = await request(app.getHttpServer())
          .get(`${pathMain}/exists/name/%20`)
          .set('x-idempotency-key', idempotencyKey)
          .set('Authorization', `Bearer ${tokens.token}`);

        expect(res.status).toBe(HttpStatus.BAD_REQUEST);

        const response = res.body as ResponseHTTP<boolean>;

        expect(response.traceId).toBeDefined();
        expect(response.traceId).toBe(idempotencyKey);
      });
    });

    describe('GET /v1/api-key/exists/name/application-id/:name/:app-id', () => {
      it('should return true when api key exists by application id and name', async () => {
        const { userId, tokens } = await helper.createUserHTTP();
        const organization = await helper.createOrganization({ userId });
        const application = await helper.createApplicationHTTP(organization.id, tokens.token);

        const created = await helper.createApiKeyHTTP(application.id, tokens.token);

        const idempotencyKey = randomUUID();

        const res = await request(app.getHttpServer())
          .get(
            `${pathMain}/exists/name/application-id/${encodeURIComponent(
              created.apiKey.name,
            )}/${application.id}`,
          )
          .set('x-idempotency-key', idempotencyKey)
          .set('Authorization', `Bearer ${tokens.token}`);

        expect(res.status).toBe(HttpStatus.OK);

        const response = res.body as ResponseHTTP<boolean>;

        expect(response.status).toBe(true);
        expect(response.method).toBe('GET');
        expect(response.path).toBe(
          `${pathMain}/exists/name/application-id/${encodeURIComponent(
            created.apiKey.name,
          )}/${application.id}`,
        );
        expect(response.traceId).toBeDefined();
        expect(response.traceId).toBe(idempotencyKey);
        expect(response.timestamp).toBeDefined();
        expect(response.body).toBe(true);
      });

      it('should return false when api key does not exist by application id and name', async () => {
        const { userId, tokens } = await helper.createUserHTTP();
        const organization = await helper.createOrganization({ userId });
        const application = await helper.createApplicationHTTP(organization.id, tokens.token);

        const idempotencyKey = randomUUID();
        const name = `non-existing-${helper.getRandomString(20)}`;

        const res = await request(app.getHttpServer())
          .get(
            `${pathMain}/exists/name/application-id/${encodeURIComponent(name)}/${application.id}`,
          )
          .set('x-idempotency-key', idempotencyKey)
          .set('Authorization', `Bearer ${tokens.token}`);

        expect(res.status).toBe(HttpStatus.OK);

        const response = res.body as ResponseHTTP<boolean>;

        expect(response.status).toBe(true);
        expect(response.method).toBe('GET');
        expect(response.path).toBe(
          `${pathMain}/exists/name/application-id/${encodeURIComponent(name)}/${application.id}`,
        );
        expect(response.traceId).toBeDefined();
        expect(response.traceId).toBe(idempotencyKey);
        expect(response.timestamp).toBeDefined();
        expect(response.body).toBe(false);
      });

      it('should return 400 when application id is invalid', async () => {
        const { tokens } = await helper.createUserHTTP();

        const name = `api-key-${helper.getRandomString(20)}`;
        const invalidApplicationId = 'invalid-uuid';
        const idempotencyKey = randomUUID();

        const res = await request(app.getHttpServer())
          .get(
            `${pathMain}/exists/name/application-id/${encodeURIComponent(
              name,
            )}/${invalidApplicationId}`,
          )
          .set('x-idempotency-key', idempotencyKey)
          .set('Authorization', `Bearer ${tokens.token}`);

        expect(res.status).toBe(HttpStatus.BAD_REQUEST);

        const response = res.body as ResponseHTTP<boolean>;

        expect(response.traceId).toBeDefined();
        expect(response.traceId).toBe(idempotencyKey);
      });

      it('should return 400 when name is empty', async () => {
        const { userId, tokens } = await helper.createUserHTTP();
        const organization = await helper.createOrganization({ userId });
        const application = await helper.createApplicationHTTP(organization.id, tokens.token);

        const idempotencyKey = randomUUID();

        const res = await request(app.getHttpServer())
          .get(`${pathMain}/exists/name/application-id/%20/${application.id}`)
          .set('x-idempotency-key', idempotencyKey)
          .set('Authorization', `Bearer ${tokens.token}`);

        expect(res.status).toBe(HttpStatus.BAD_REQUEST);

        const response = res.body as ResponseHTTP<boolean>;

        expect(response.traceId).toBeDefined();
        expect(response.traceId).toBe(idempotencyKey);
      });
    });

    describe('GET /v1/api-key/exists/:id', () => {
      it('should return true when api key exists by id', async () => {
        const { userId, tokens } = await helper.createUserHTTP();
        const organization = await helper.createOrganization({ userId });
        const application = await helper.createApplicationHTTP(organization.id, tokens.token);

        const created = await helper.createApiKeyHTTP(application.id, tokens.token);

        const idempotencyKey = randomUUID();

        const res = await request(app.getHttpServer())
          .get(`${pathMain}/exists/${created.apiKey.id}`)
          .set('x-idempotency-key', idempotencyKey)
          .set('Authorization', `Bearer ${tokens.token}`);

        expect(res.status).toBe(HttpStatus.OK);

        const response = res.body as ResponseHTTP<boolean>;

        expect(response.status).toBe(true);
        expect(response.method).toBe('GET');
        expect(response.path).toBe(`${pathMain}/exists/${created.apiKey.id}`);
        expect(response.traceId).toBeDefined();
        expect(response.traceId).toBe(idempotencyKey);
        expect(response.timestamp).toBeDefined();
        expect(response.body).toBe(true);
      });

      it('should return false when api key does not exist by id', async () => {
        const { tokens } = await helper.createUserHTTP();

        const nonExistingId = randomUUID();
        const idempotencyKey = randomUUID();

        const res = await request(app.getHttpServer())
          .get(`${pathMain}/exists/${nonExistingId}`)
          .set('x-idempotency-key', idempotencyKey)
          .set('Authorization', `Bearer ${tokens.token}`);

        expect(res.status).toBe(HttpStatus.OK);

        const response = res.body as ResponseHTTP<boolean>;

        expect(response.status).toBe(true);
        expect(response.method).toBe('GET');
        expect(response.path).toBe(`${pathMain}/exists/${nonExistingId}`);
        expect(response.traceId).toBeDefined();
        expect(response.traceId).toBe(idempotencyKey);
        expect(response.timestamp).toBeDefined();
        expect(response.body).toBe(false);
      });

      it('should return 400 when id is an invalid UUID', async () => {
        const { tokens } = await helper.createUserHTTP();

        const invalidId = 'invalid-uuid';
        const idempotencyKey = randomUUID();

        const res = await request(app.getHttpServer())
          .get(`${pathMain}/exists/${invalidId}`)
          .set('x-idempotency-key', idempotencyKey)
          .set('Authorization', `Bearer ${tokens.token}`);

        expect(res.status).toBe(HttpStatus.BAD_REQUEST);

        const response = res.body as ResponseHTTP<boolean>;

        expect(response.traceId).toBeDefined();
        expect(response.traceId).toBe(idempotencyKey);
      });
    });
  });

  describe('GET /v1/api-key/:id', () => {
    it('should return an API key successfully', async () => {
      const { userId, tokens } = await helper.createUserHTTP();

      const organization = await helper.createOrganization({ userId });

      const application = await helper.createApplicationHTTP(organization.id, tokens.token);

      const created = await helper.createApiKeyHTTP(application.id, tokens.token);

      const idempotencyKey = randomUUID();
      const path = `${pathMain}/${created.apiKey.id}`;

      const res = await request(app.getHttpServer())
        .get(path)
        .set('x-idempotency-key', idempotencyKey)
        .set('Authorization', `Bearer ${tokens.token}`);

      expect(res.status).toBe(HttpStatus.OK);

      const response = res.body as ResponseHTTP<ApiKeyDto>;

      expect(response.status).toBe(true);
      expect(response.method).toBe('GET');
      expect(response.path).toBe(path);
      expect(response.traceId).toBeDefined();
      expect(response.traceId).toBe(idempotencyKey);
      expect(response.timestamp).toBeDefined();

      expect(response.body).toBeDefined();
      expect(response.body.id).toBe(created.apiKey.id);
      expect(response.body.applicationId).toBe(application.id);
      expect(response.body.name).toBe(created.apiKey.name);
      expect(response.body.environment).toBe(created.apiKey.environment);
      expect(response.body.enabled).toBe(created.apiKey.enabled);
    });

    it('should return 400 when id is not a valid UUID', async () => {
      const { tokens } = await helper.createUserHTTP();

      const invalidId = 'invalid-uuid';
      const idempotencyKey = randomUUID();
      const path = `${pathMain}/${invalidId}`;

      const res = await request(app.getHttpServer())
        .get(path)
        .set('x-idempotency-key', idempotencyKey)
        .set('Authorization', `Bearer ${tokens.token}`);

      expect(res.status).toBe(HttpStatus.BAD_REQUEST);

      const response = res.body as ResponseHTTP<ApiKeyDto>;

      expect(response.traceId).toBeDefined();
      expect(response.traceId).toBe(idempotencyKey);
    });

    it('should return 404 when API key does not exist', async () => {
      const { tokens } = await helper.createUserHTTP();

      const id = randomUUID();
      const idempotencyKey = randomUUID();
      const path = `${pathMain}/${id}`;

      const res = await request(app.getHttpServer())
        .get(path)
        .set('x-idempotency-key', idempotencyKey)
        .set('Authorization', `Bearer ${tokens.token}`);

      expect(res.status).toBe(HttpStatus.NOT_FOUND);

      const response = res.body as ResponseHTTP<ApiKeyDto>;

      expect(response.traceId).toBeDefined();
      expect(response.traceId).toBe(idempotencyKey);
    });

    it('should return 403 when user does not have access to the API key', async () => {
      const owner = await helper.createUserHTTP();

      const organization = await helper.createOrganization({
        userId: owner.userId,
      });

      const application = await helper.createApplicationHTTP(organization.id, owner.tokens.token);

      const created = await helper.createApiKeyHTTP(application.id, owner.tokens.token);

      const anotherUser = await helper.createUserHTTP();

      const idempotencyKey = randomUUID();
      const path = `${pathMain}/${created.apiKey.id}`;

      const res = await request(app.getHttpServer())
        .get(path)
        .set('x-idempotency-key', idempotencyKey)
        .set('Authorization', `Bearer ${anotherUser.tokens.token}`);

      expect(res.status).toBe(HttpStatus.FORBIDDEN);

      const response = res.body as ResponseHTTP<ApiKeyDto>;

      expect(response.traceId).toBeDefined();
      expect(response.traceId).toBe(idempotencyKey);
    });
  });

  describe('DELETE /v1/api-key/:id', () => {
    it('should delete an API key successfully', async () => {
      const { userId, tokens } = await helper.createUserHTTP();

      const organization = await helper.createOrganization({ userId });

      const application = await helper.createApplicationHTTP(organization.id, tokens.token);

      const created = await helper.createApiKeyHTTP(application.id, tokens.token);

      const idempotencyKey = randomUUID();
      const path = `${pathMain}/${created.apiKey.id}`;

      const res = await request(app.getHttpServer())
        .delete(path)
        .set('x-idempotency-key', idempotencyKey)
        .set('Authorization', `Bearer ${tokens.token}`);

      expect(res.status).toBe(HttpStatus.OK);

      const response = res.body as ResponseHTTP<null>;

      expect(response.status).toBe(true);
      expect(response.method).toBe('DELETE');
      expect(response.path).toBe(path);
      expect(response.traceId).toBeDefined();
      expect(response.traceId).toBe(idempotencyKey);
      expect(response.timestamp).toBeDefined();

      const apiKey = await helper.apiKeyRepository.findById(created.apiKey.id);

      expect(apiKey).toBeNull();
    });

    it('should return 404 when API key does not exist', async () => {
      const { tokens } = await helper.createUserHTTP();

      const id = randomUUID();
      const idempotencyKey = randomUUID();
      const path = `${pathMain}/${id}`;

      const res = await request(app.getHttpServer())
        .delete(path)
        .set('x-idempotency-key', idempotencyKey)
        .set('Authorization', `Bearer ${tokens.token}`);

      expect(res.status).toBe(HttpStatus.NOT_FOUND);

      const response = res.body as ResponseHTTP<null>;

      expect(response.traceId).toBeDefined();
      expect(response.traceId).toBe(idempotencyKey);
    });

    it('should return 400 when id is not a valid UUID', async () => {
      const { tokens } = await helper.createUserHTTP();

      const id = 'invalid-uuid';
      const idempotencyKey = randomUUID();
      const path = `${pathMain}/${id}`;

      const res = await request(app.getHttpServer())
        .delete(path)
        .set('x-idempotency-key', idempotencyKey)
        .set('Authorization', `Bearer ${tokens.token}`);

      expect(res.status).toBe(HttpStatus.BAD_REQUEST);

      const response = res.body as ResponseHTTP<null>;

      expect(response.traceId).toBeDefined();
      expect(response.traceId).toBe(idempotencyKey);
    });

    it('should return 403 when API key does not belong to the user', async () => {
      const owner = await helper.createUserHTTP();

      const organization = await helper.createOrganization({
        userId: owner.userId,
      });

      const application = await helper.createApplicationHTTP(organization.id, owner.tokens.token);

      const created = await helper.createApiKeyHTTP(application.id, owner.tokens.token);

      const anotherUser = await helper.createUserHTTP();

      const idempotencyKey = randomUUID();
      const path = `${pathMain}/${created.apiKey.id}`;

      const res = await request(app.getHttpServer())
        .delete(path)
        .set('x-idempotency-key', idempotencyKey)
        .set('Authorization', `Bearer ${anotherUser.tokens.token}`);

      expect(res.status).toBe(HttpStatus.FORBIDDEN);

      const response = res.body as ResponseHTTP<null>;

      expect(response.traceId).toBeDefined();
      expect(response.traceId).toBe(idempotencyKey);

      const apiKey = await helper.apiKeyRepository.findById(created.apiKey.id);

      expect(apiKey).not.toBeNull();
    });
  });

  describe('GET /v1/api-key', () => {
    it('should return a paginated list of API keys successfully', async () => {
      const { userId, tokens } = await helper.createUserHTTP();
      const organization = await helper.createOrganization({ userId });
      const application = await helper.createApplicationHTTP(organization.id, tokens.token);

      await helper.createApiKeyHTTP(application.id, tokens.token);
      await helper.createApiKeyHTTP(application.id, tokens.token);

      const idempotencyKey = randomUUID();

      const res = await request(app.getHttpServer())
        .get(pathMain)
        .set('x-idempotency-key', idempotencyKey)
        .set('Authorization', `Bearer ${tokens.token}`);

      expect(res.status).toBe(HttpStatus.OK);

      const response = res.body as ResponseHTTP<Page<ApiKeyDto>>;

      expect(response.status).toBe(true);
      expect(response.method).toBe('GET');
      expect(response.path).toBe(pathMain);
      expect(response.traceId).toBe(idempotencyKey);
      expect(response.timestamp).toBeDefined();

      expect(response.body).toBeDefined();
      expect(Array.isArray(response.body.content)).toBe(true);
      expect(response.body.content.length).toBeGreaterThanOrEqual(2);
      expect(response.body.page).toBe(1);
      expect(response.body.size).toBeDefined();
      expect(response.body.totalElements).toBeGreaterThanOrEqual(2);
    });

    it('should filter API keys by applicationId', async () => {
      const { userId, tokens } = await helper.createUserHTTP();
      const organization = await helper.createOrganization({ userId });

      const app1 = await helper.createApplicationHTTP(organization.id, tokens.token);
      const app2 = await helper.createApplicationHTTP(organization.id, tokens.token);

      const createdKeyApp1 = await helper.createApiKeyHTTP(app1.id, tokens.token);
      await helper.createApiKeyHTTP(app2.id, tokens.token);

      const idempotencyKey = randomUUID();

      const res = await request(app.getHttpServer())
        .get(`${pathMain}?applicationId=${app1.id}`)
        .set('x-idempotency-key', idempotencyKey)
        .set('Authorization', `Bearer ${tokens.token}`);

      expect(res.status).toBe(HttpStatus.OK);

      const response = res.body as ResponseHTTP<Page<ApiKeyDto>>;

      expect(response.status).toBe(true);
      expect(response.body.content.length).toBe(1);
      expect(response.body.content[0].id).toBe(createdKeyApp1.apiKey.id);
      expect(response.body.content[0].applicationId).toBe(app1.id);
    });

    it('should filter API keys by enabled status', async () => {
      const { userId, tokens } = await helper.createUserHTTP();
      const organization = await helper.createOrganization({ userId });
      const application = await helper.createApplicationHTTP(organization.id, tokens.token);

      await helper.createApiKeyHTTP(application.id, tokens.token, { enabled: true });
      await helper.createApiKeyHTTP(application.id, tokens.token, { enabled: false });

      const idempotencyKey = randomUUID();

      const res = await request(app.getHttpServer())
        .get(`${pathMain}?enabled=false`)
        .set('x-idempotency-key', idempotencyKey)
        .set('Authorization', `Bearer ${tokens.token}`);

      expect(res.status).toBe(HttpStatus.OK);

      const response = res.body as ResponseHTTP<Page<ApiKeyDto>>;

      expect(response.status).toBe(true);
      expect(response.body.content.every((key) => key.enabled === false)).toBe(true);
    });

    it('should respect custom pagination parameters (page and size)', async () => {
      const { userId, tokens } = await helper.createUserHTTP();
      const organization = await helper.createOrganization({ userId });
      const application = await helper.createApplicationHTTP(organization.id, tokens.token);

      await helper.createApiKeyHTTP(application.id, tokens.token);
      await helper.createApiKeyHTTP(application.id, tokens.token);

      const idempotencyKey = randomUUID();

      const res = await request(app.getHttpServer())
        .get(`${pathMain}?page=1&size=1`)
        .set('x-idempotency-key', idempotencyKey)
        .set('Authorization', `Bearer ${tokens.token}`);

      expect(res.status).toBe(HttpStatus.OK);

      const response = res.body as ResponseHTTP<Page<ApiKeyDto>>;

      expect(response.status).toBe(true);
      expect(response.body.page).toBe(1);
      expect(response.body.size).toBe(1);
      expect(response.body.content.length).toBe(1);
    });

    it('should return 400 when filter applicationId is an invalid UUID', async () => {
      const { tokens } = await helper.createUserHTTP();

      const idempotencyKey = randomUUID();

      const res = await request(app.getHttpServer())
        .get(`${pathMain}?applicationId=invalid-uuid`)
        .set('x-idempotency-key', idempotencyKey)
        .set('Authorization', `Bearer ${tokens.token}`);

      expect(res.status).toBe(HttpStatus.BAD_REQUEST);

      const response = res.body as ResponseHTTP<any>;

      expect(response.traceId).toBe(idempotencyKey);
    });
  });

  describe('GET /v1/api-key/count/application-id/:applicationId', () => {
    it('should return total count of API keys for an application', async () => {
      const { userId, tokens } = await helper.createUserHTTP();
      const organization = await helper.createOrganization({ userId });
      const application = await helper.createApplicationHTTP(organization.id, tokens.token);

      await helper.createApiKeyHTTP(application.id, tokens.token);
      await helper.createApiKeyHTTP(application.id, tokens.token);

      const idempotencyKey = randomUUID();
      const path = `${pathMain}/count/application-id/${application.id}`;

      const res = await request(app.getHttpServer())
        .get(path)
        .set('x-idempotency-key', idempotencyKey)
        .set('Authorization', `Bearer ${tokens.token}`);

      expect(res.status).toBe(HttpStatus.OK);

      const response = res.body as ResponseHTTP<number>;

      expect(response.status).toBe(true);
      expect(response.method).toBe('GET');
      expect(response.path).toBe(path);
      expect(response.traceId).toBe(idempotencyKey);
      expect(response.timestamp).toBeDefined();
      expect(response.body).toBe(2);
    });

    it('should return 0 when application has no API keys', async () => {
      const { userId, tokens } = await helper.createUserHTTP();
      const organization = await helper.createOrganization({ userId });
      const application = await helper.createApplicationHTTP(organization.id, tokens.token);

      const idempotencyKey = randomUUID();
      const path = `${pathMain}/count/application-id/${application.id}`;

      const res = await request(app.getHttpServer())
        .get(path)
        .set('x-idempotency-key', idempotencyKey)
        .set('Authorization', `Bearer ${tokens.token}`);

      expect(res.status).toBe(HttpStatus.OK);

      const response = res.body as ResponseHTTP<number>;

      expect(response.status).toBe(true);
      expect(response.body).toBe(0);
    });

    it('should return 400 when applicationId is an invalid UUID', async () => {
      const { tokens } = await helper.createUserHTTP();

      const invalidApplicationId = 'invalid-uuid';
      const idempotencyKey = randomUUID();
      const path = `${pathMain}/count/application-id/${invalidApplicationId}`;

      const res = await request(app.getHttpServer())
        .get(path)
        .set('x-idempotency-key', idempotencyKey)
        .set('Authorization', `Bearer ${tokens.token}`);

      expect(res.status).toBe(HttpStatus.BAD_REQUEST);

      const response = res.body as ResponseHTTP<number>;

      expect(response.traceId).toBe(idempotencyKey);
    });

    it('should return 403 when user does not own the application', async () => {
      const owner = await helper.createUserHTTP();
      const organization = await helper.createOrganization({ userId: owner.userId });
      const application = await helper.createApplicationHTTP(organization.id, owner.tokens.token);

      const anotherUser = await helper.createUserHTTP();

      const idempotencyKey = randomUUID();
      const path = `${pathMain}/count/application-id/${application.id}`;

      const res = await request(app.getHttpServer())
        .get(path)
        .set('x-idempotency-key', idempotencyKey)
        .set('Authorization', `Bearer ${anotherUser.tokens.token}`);

      expect(res.status).toBe(HttpStatus.FORBIDDEN);

      const response = res.body as ResponseHTTP<number>;

      expect(response.traceId).toBe(idempotencyKey);
    });
  });
});
