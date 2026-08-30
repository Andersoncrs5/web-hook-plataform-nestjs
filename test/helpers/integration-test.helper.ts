import { HttpStatus, INestApplication, InternalServerErrorException } from '@nestjs/common';

import { ResponseHTTP } from 'src/utils/http/responseHttp.res';
import request from 'supertest';

import { randomBytes, randomUUID, createHash, createHmac, timingSafeEqual } from 'node:crypto';

import * as argon2 from 'argon2';

import { User } from 'src/modules/user/entities/user.entity';
import { UserStatus } from 'src/common/enums/user/user-status.enum';

import { Role } from 'src/modules/roles/entities/role.entity';

import { UserRepository } from 'src/modules/user/repository/user.repository';
import { RoleRepository } from 'src/modules/roles/repository/roles.repository';
import { UserRoleRepository } from 'src/modules/user-role/repository/user-role.repository';
import { RefreshTokenEntity } from 'src/modules/auth/resfresh-token/entities/refresh-token.entity';
import { RefreshTokenStatus } from 'src/common/enums/refresh-token/refresh-token-status.enum';
import { RefreshTokenRepository } from 'src/modules/auth/resfresh-token/repository/refresh-token.repository';
import { InboxRepository } from 'src/infra/transactional-messaging/inbox/repository/inbox.repository';
import { InboxEntity } from 'src/infra/transactional-messaging/inbox/entities/inbox.entity';
import { InboxStatus } from 'src/utils/enums/inbox-status.enum';
import { Tokens } from 'src/modules/auth/classes/token.class';
import { CreateUserDto } from 'src/modules/user/dto/create-user.dto';
import { OrganizationEntity } from 'src/modules/organizations/entities/organization.entity';
import { OrganizationStatus } from 'src/common/enums/organization/organization-status.enum';
import { OrganizationRepository } from 'src/modules/organizations/repository/organization.repository';
import { LoginUserDto } from 'src/modules/auth/dto/request/login-user.requests';
import { ApplicationRepository } from 'src/modules/application/repository/application.repository';
import { ApplicationEntity } from 'src/modules/application/entities/application.entity';
import {
  ApplicationEnvironmentEnum,
  ApplicationStatusEnum,
  ApplicationTypeEnum,
} from 'src/common/enums/application/application.enums';
import { CreateApplicationDto } from 'src/modules/application/dto/request/create-application.dto';
import { ApplicationDto } from 'src/modules/application/dto/response/application.dto';
import { ApiKeyRepository } from 'src/modules/api-key/repository/api-key.repository';
import { ApiKeyEntity } from 'src/modules/api-key/entities/api-key.entity';
import { ApiKeyEnvironmentEnum } from 'src/common/enums/apiKeys/api-keys.enums';

export class BaseTestHelper {
  readonly userRepository: UserRepository;
  readonly roleRepository: RoleRepository;
  readonly userRoleRepository: UserRoleRepository;
  readonly refreshTokenRepository: RefreshTokenRepository;
  readonly inboxRepository: InboxRepository;
  readonly organizationRepository: OrganizationRepository;
  readonly applicationRepository: ApplicationRepository;
  readonly apiKeyRepository: ApiKeyRepository;

  constructor(private readonly app: INestApplication) {
    this.userRepository = app.get(UserRepository);
    this.roleRepository = app.get(RoleRepository);
    this.userRoleRepository = app.get(UserRoleRepository);
    this.refreshTokenRepository = app.get(RefreshTokenRepository);
    this.inboxRepository = app.get(InboxRepository);
    this.organizationRepository = app.get(OrganizationRepository);
    this.applicationRepository = app.get(ApplicationRepository);
    this.apiKeyRepository = app.get(ApiKeyRepository);
  }

  async createFakeApiKey(
    userId: string,
    applicationId: string,
    override: Partial<ApiKeyEntity> = {},
  ): Promise<ApiKeyEntity> {
    const randomKey = this.getRandomString(32);

    const apiKey: ApiKeyEntity = {
      id: this.generateUuid(),
      applicationId: applicationId,
      createdBy: userId,
      name: `API Key ${this.getRandomString(10)}`,
      keyHash: `hash_${randomKey}`,
      keyPrefix: `sk_${randomKey.substring(0, 8)}`,
      keyLastChars: randomKey.substring(randomKey.length - 4),
      metadata: null,
      environment: ApiKeyEnvironmentEnum.TEST,
      lastUsedAt: null,
      expiresAt: null,
      enabled: true,
      version: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      ...override,
    };

    return this.apiKeyRepository.create(apiKey);
  }

  async createApplicationHTTP(
    organizationId: string,
    token: string,
    override: Partial<ApplicationEntity> = {},
  ) {
    const path = '/v1/applications';

    const key = this.getRandomString(20);
    const idempotencyKey = randomUUID();

    const dto: CreateApplicationDto = {
      name: `name random ${key}`,
      organizationId,
      slug: `name-random-${key.toLowerCase()}`,
      status: ApplicationStatusEnum.ACTIVE,
      description: 'Any desc',
      environment: ApplicationEnvironmentEnum.PROD,
      logoUrl: 'https://example.com/logo.png',
      homepageUrl: 'https://example.com',
      metadata: null,
      rateLimit: null,
      type: ApplicationTypeEnum.WEB,
      ...override,
    };

    const res = await request(this.app.getHttpServer())
      .post(path)
      .set('x-idempotency-key', idempotencyKey)
      .set('Authorization', `Bearer ${token}`)
      .send(dto);

    const response = res.body as ResponseHTTP<ApplicationDto>;

    expect(res.status).toBe(HttpStatus.CREATED);

    expect(response).toMatchObject({
      status: true,
      path,
      method: 'POST',
    });

    expect(response.traceId).toBeDefined();

    expect(response.traceId).toBe(idempotencyKey);

    expect(response.timestamp).toBeDefined();

    expect(response.body).toBeDefined();

    expect(response.body).toMatchObject({
      organizationId: dto.organizationId,
      name: dto.name,
      slug: dto.slug,
      status: dto.status,
      description: dto.description,
      environment: dto.environment,
      logoUrl: dto.logoUrl,
      homepageUrl: dto.homepageUrl,
      rateLimit: dto.rateLimit,
      type: dto.type,
    });

    expect(response.body.id).toBeDefined();

    return response.body;
  }

  async createFakeApplication(
    override: Partial<ApplicationEntity> = {},
  ): Promise<ApplicationEntity> {
    const { user } = await this.createUserHTTP();
    const org = await this.createOrganization({ userId: user.id });
    const randomKey = this.getRandomString(10);

    const application: ApplicationEntity = {
      id: this.generateUuid(),
      name: `App ${randomKey}`,
      slug: `app-${randomKey.toLowerCase()}`,
      organizationId: org.id,
      createdBy: user.id,
      type: ApplicationTypeEnum.WEB,
      environment: ApplicationEnvironmentEnum.PROD,
      status: ApplicationStatusEnum.ACTIVE,
      logoUrl: 'https://example.com/logo.png',
      homepageUrl: 'https://example.com',
      description: 'Test Application',
      metadata: null,
      rateLimit: null,
      version: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      ...override,
    };

    return await this.applicationRepository.create(application);
  }

  async createFakeUserWithRefreshToken(
    userOverride: Partial<User> = {},
    tokenOverride: Partial<RefreshTokenEntity> = {},
  ): Promise<{
    user: User;
    refreshToken: RefreshTokenEntity;
  }> {
    const user = await this.createFakeUser(userOverride);

    const createdUser = await this.userRepository.create(user);

    const refreshToken = await this.createFakeRefreshToken({
      userId: createdUser.id,
      ...tokenOverride,
    });

    const createdRefreshToken = await this.refreshTokenRepository.create(refreshToken);

    return {
      user: createdUser,
      refreshToken: createdRefreshToken,
    };
  }

  // ============================================================
  // HTTP
  // ============================================================

  async post<T>(url: string, payload: any, token?: string): Promise<T> {
    const req = request(this.app.getHttpServer()).post(url);

    if (token) {
      req.set('Authorization', `Bearer ${token}`);
    }

    const res = await req.send(payload);

    expect(res.status).toBeGreaterThanOrEqual(200);
    expect(res.status).toBeLessThan(300);

    const response = res.body as ResponseHTTP<T>;

    expect(response.message).toBeDefined();
    expect(response.traceId).toBeDefined();

    return response.body;
  }

  async createFakeOrganization(
    override: Partial<OrganizationEntity> = {},
  ): Promise<OrganizationEntity> {
    const key = this.getRandomString(10);

    return {
      id: this.generateUuid(),
      name: 'Organization_' + key,
      slug: 'org-' + key.toLowerCase(),
      status: OrganizationStatus.ACTIVE,
      userId: override.userId ?? this.generateUuid(),
      metadata: null,
      version: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      ...override,
    };
  }

  async createOrganization(
    override: Partial<OrganizationEntity> = {},
  ): Promise<OrganizationEntity> {
    const organization = await this.createFakeOrganization(override);

    return await this.organizationRepository.create(organization);
  }

  async createFakeInbox(override: Partial<InboxEntity> = {}): Promise<InboxEntity> {
    const key = this.getRandomString(16);

    const payload = JSON.stringify({
      event: 'user.created',
      data: {
        id: this.generateUuid(),
        name: `User_${key}`,
      },
    });

    return {
      id: this.generateUuid(),

      source: `source_${key}`,

      messageId: `message_${key}`,

      payload: payload,

      status: InboxStatus.PENDING,

      processedAt: null,

      version: 0,

      createdAt: new Date(),

      updatedAt: new Date(),

      deletedAt: null,

      ...override,
    };
  }

  async createInbox(override: Partial<InboxEntity> = {}): Promise<InboxEntity> {
    const inboxEntity = await this.createFakeInbox(override);

    return this.inboxRepository.create(inboxEntity);
  }

  async loginMasterHTTP() {
    const path = '/v1/auth/login';

    const idempotencyKey = randomUUID();

    const dto: LoginUserDto = {
      email: `user.master.210@gmail.com`,
      password: '12345678',
    };

    const res = await request(this.app.getHttpServer())
      .post(path)
      .set('x-idempotency-key', idempotencyKey)
      .send(dto);

    const response = res.body as ResponseHTTP<Tokens>;

    expect(res.status).toBe(HttpStatus.OK);

    expect(response).toMatchObject({
      status: true,
      path,
      method: 'POST',
    });

    expect(response.traceId).toBeDefined();
    expect(response.traceId).toBe(idempotencyKey);
    expect(response.timestamp).toBeDefined();
    expect(response.body).toBeDefined();

    expect(response.body.user).toMatchObject({
      email: dto.email,
    });

    expect(response.body.user.id).toBeDefined();

    expect(response.body.token).toBeDefined();
    expect(response.body.token).not.toBe('');

    expect(response.body.refreshToken).toBeDefined();
    expect(response.body.refreshToken).not.toBe('');

    expect(response.body.tokenExp).toBeDefined();
    expect(response.body.refreshTokenExp).toBeDefined();

    expect(response.body.roles).toEqual(['MASTER']);

    return {
      dto: dto,
      tokens: response.body,
    };
  }

  async createUserRole(
    override: Partial<{
      id: string;
      userId: string;
      roleId: string;
      version: number;
      createdAt: Date;
      updatedAt: Date;
      deletedAt: Date | null;
    }> = {},
  ) {
    return this.userRoleRepository.create({
      id: this.generateUuid(),
      userId: override.userId ?? this.generateUuid(),
      roleId: override.roleId ?? this.generateUuid(),
      version: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      ...override,
    });
  }

  // ============================================================
  // USERS
  // ============================================================

  createFakeUser(override: Partial<User> = {}): Promise<User> {
    return this.buildFakeUser(override);
  }

  async createFakeRefreshToken(
    override: Partial<RefreshTokenEntity> = {},
  ): Promise<RefreshTokenEntity> {
    const key = this.randomBase64Url(32);

    return {
      id: this.generateUuid(),

      userId: this.generateUuid(),

      tokenHash: this.sha256(key),

      status: RefreshTokenStatus.ACTIVE,

      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),

      revokedAt: null,

      replacedByTokenId: null,

      version: 0,

      createdAt: new Date(),

      updatedAt: new Date(),

      deletedAt: null,

      ...override,
    };
  }

  async createUser(override: Partial<User> = {}): Promise<User> {
    const user = await this.buildFakeUser(override);

    return this.userRepository.create(user);
  }

  async createUserHTTP() {
    const path = '/v1/auth/register';

    const key = this.getRandomString(20);
    const idempotencyKey = randomUUID();

    const dto: CreateUserDto = {
      name: `name ${key}`,
      email: `user${key}@gmail.com`,
      fullName: `full name ${key}`,
      password: '12345678',
    };

    const res = await request(this.app.getHttpServer())
      .post(path)
      .set('x-idempotency-key', idempotencyKey)
      .send(dto);

    const response = res.body as ResponseHTTP<Tokens>;

    expect(res.status).toBe(HttpStatus.CREATED);

    expect(response).toMatchObject({
      status: true,
      path,
      method: 'POST',
    });

    expect(response.traceId).toBeDefined();
    expect(response.traceId).toBe(idempotencyKey);
    expect(response.timestamp).toBeDefined();
    expect(response.body).toBeDefined();

    expect(response.body.user).toMatchObject({
      name: dto.name,
      fullName: dto.fullName,
      email: dto.email,
    });

    expect(response.body.user.id).toBeDefined();

    expect(response.body.token).toBeDefined();
    expect(response.body.token).not.toBe('');

    expect(response.body.refreshToken).toBeDefined();
    expect(response.body.refreshToken).not.toBe('');

    expect(response.body.tokenExp).toBeDefined();
    expect(response.body.refreshTokenExp).toBeDefined();

    expect(response.body.roles).toEqual([]);

    return {
      dto: dto,
      tokens: response.body,
      user: response.body.user,
      userId: response.body.user.id,
    };
  }

  private async buildFakeUser(override: Partial<User> = {}): Promise<User> {
    const key = this.getRandomString(12);

    return {
      id: this.generateUuid(),

      name: 'User_' + key,

      fullName: 'Full Name ' + key,

      email: `user_${key.toLowerCase()}@example.com`,

      passwordHash: await this.hash('12345678'),

      emailVerified: false,

      status: UserStatus.ACTIVE,

      lastLoginAt: null,

      version: 0,

      createdAt: new Date(),

      updatedAt: new Date(),

      deletedAt: null,

      ...override,
    };
  }

  // ============================================================
  // ROLES
  // ============================================================

  createFakeRole(override: Partial<Role> = {}): Role {
    const key = this.getRandomString(22);

    return {
      id: this.generateUuid(),

      name: 'role_' + key,

      description: 'role_desc_' + key,

      isActive: true,

      version: 0,

      createdAt: new Date(),

      updatedAt: new Date(),

      deletedAt: null,

      ...override,
    };
  }

  async createRole(override: Partial<Role> = {}): Promise<Role> {
    const role = this.createFakeRole(override);

    return this.roleRepository.create(role);
  }

  getInboxRepository(): InboxRepository {
    return this.inboxRepository;
  }

  // ============================================================
  // RANDOM
  // ============================================================

  getRandomInt = (min: number = 1, max: number = 100000000000000): number => {
    min = Math.ceil(min);
    max = Math.floor(max);

    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  getRandomString = (length: number = 10): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

    let result = '';

    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return result;
  };

  generateUuid(): string {
    return randomUUID();
  }

  randomHex(size = 32): string {
    return randomBytes(size).toString('hex');
  }

  randomBase64Url(size = 32): string {
    return randomBytes(size).toString('base64url');
  }

  // ============================================================
  // CRYPTO
  // ============================================================

  sha256(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }

  sha512(value: string): string {
    return createHash('sha512').update(value).digest('hex');
  }

  hmacSha256(secret: string, payload: string): string {
    return createHmac('sha256', secret).update(payload).digest('hex');
  }

  secureCompare(left: string, right: string): boolean {
    const a = Buffer.from(left);

    const b = Buffer.from(right);

    if (a.length !== b.length) {
      return false;
    }

    return timingSafeEqual(a, b);
  }

  generateWebhookSecret(): string {
    return `whsec_${this.randomBase64Url(32)}`;
  }

  generateApiKey(): string {
    return `whpk_${this.randomBase64Url(32)}`;
  }

  generateRefreshToken(): string {
    return this.randomBase64Url(64);
  }

  // ============================================================
  // PASSWORD
  // ============================================================

  async hash(password: string): Promise<string> {
    try {
      return await argon2.hash(password, {
        type: argon2.argon2id,

        memoryCost: Number(process.env.ARGON_MEMORY) || 65536,

        timeCost: Number(process.env.ARGON_ITERATIONS) || 3,

        parallelism: Number(process.env.ARGON_PARALLELISM) || 1,
      });
    } catch (error) {
      throw new InternalServerErrorException('Error hashing password');
    }
  }

  async verify(hash: string, password: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, password);
    } catch (error) {
      return false;
    }
  }
}
