import { INestApplication } from "@nestjs/common";


import { RefreshTokenRepository } from "src/modules/auth/resfresh-token/repository/refresh-token.repository";
import { RefreshTokenEntity } from "src/modules/auth/resfresh-token/entities/refresh-token.entity";
import { BaseTestHelper } from "../../../../../test/helpers/integration-test.helper";
import { BaseIntegrationTest } from "../../../../../test/helpers/base-test.helper";

describe("RefreshTokenRepository (Integration Test)", () => {

    let app: INestApplication;
    let helper: BaseTestHelper;
    let repository: RefreshTokenRepository;

    beforeAll(async () => {

        await BaseIntegrationTest.setupAll();

        app = BaseIntegrationTest.getApp();

        helper = new BaseTestHelper(app);

        repository = app.get<RefreshTokenRepository>(
            RefreshTokenRepository,
        );

    }, 180000);

    afterAll(async () => {
        await BaseIntegrationTest.teardownAll();
    });

    it("should be defined", () => {

        expect(app).toBeDefined();

        expect(helper).toBeDefined();

        expect(repository).toBeDefined();

    });

    describe("create", () => {

        it("should create a refresh token successfully", async () => {

            const { user } =
                await helper.createFakeUserWithRefreshToken();

            const token = await helper.createFakeRefreshToken({
                userId: user.id,
            });

            const created =
                await repository.create(token);

            expect(created).toBeDefined();

            expect(created.id).toBe(token.id);

            expect(created.userId).toBe(user.id);

            expect(created.tokenHash).toBe(
                token.tokenHash,
            );

            expect(created.status).toBe(
                token.status,
            );

            expect(created.version).toBe(0);

            expect(created.revokedAt).toBeNull();

            expect(created.replacedByTokenId).toBeNull();

            expect(created.expiresAt).toEqual(
                token.expiresAt,
            );

        });

    });

    describe("findById", () => {

        it("should return the refresh token when id exists", async () => {

            const { refreshToken } =
                await helper.createFakeUserWithRefreshToken();

            const found =
                await repository.findById(refreshToken.id);

            expect(found).not.toBeNull();

            expect(found?.id).toBe(
                refreshToken.id,
            );

            expect(found?.userId).toBe(
                refreshToken.userId,
            );

            expect(found?.tokenHash).toBe(
                refreshToken.tokenHash,
            );

        });

        it("should return null when id does not exist", async () => {

            const id =
                helper.generateUuid();

            const found =
                await repository.findById(id);

            expect(found).toBeNull();

        });

    });

    describe("findByTokenHash", () => {

        it("should return the token when hash exists", async () => {

            const { refreshToken } =
                await helper.createFakeUserWithRefreshToken();

            const found =
                await repository.findByTokenHash(
                    refreshToken.tokenHash,
                );

            expect(found).not.toBeNull();

            expect(found?.id).toBe(
                refreshToken.id,
            );

            expect(found?.tokenHash).toBe(
                refreshToken.tokenHash,
            );

        });

        it("should return null when hash does not exist", async () => {

            const hash =
                helper.sha256(
                    helper.generateRefreshToken(),
                );

            const found =
                await repository.findByTokenHash(hash);

            expect(found).toBeNull();

        });

    });

    describe("findByTokenHashWithUser", () => {

        it("should return refresh token and user", async () => {

            const { user, refreshToken } =
                await helper.createFakeUserWithRefreshToken();

            const found =
                await repository.findByTokenHashWithUser(
                    refreshToken.tokenHash,
                );

            expect(found).not.toBeNull();

            expect(found?.refreshToken).toBeDefined();

            expect(found?.user).toBeDefined();

            expect(found?.refreshToken.id).toBe(
                refreshToken.id,
            );

            expect(found?.refreshToken.userId).toBe(
                user.id,
            );

            expect(found?.user.id).toBe(
                user.id,
            );

            expect(found?.user.email).toBe(
                user.email,
            );

        });

        it("should return null when token does not exist", async () => {

            const hash =
                helper.sha256(
                    helper.generateRefreshToken(),
                );

            const found =
                await repository.findByTokenHashWithUser(
                    hash,
                );

            expect(found).toBeNull();

        });

        it("should not return revoked tokens", async () => {

            const { refreshToken } =
                await helper.createFakeUserWithRefreshToken({
                    },
                    {
                        revokedAt: new Date(),
                    },
                );

            const found =
                await repository.findByTokenHashWithUser(
                    refreshToken.tokenHash,
                );

            expect(found).toBeNull();

        });

        it("should not return expired tokens", async () => {

            const { refreshToken } =
                await helper.createFakeUserWithRefreshToken(
                    {},
                    {
                        expiresAt: new Date(
                            Date.now() - 1000,
                        ),
                    },
                );

            const found =
                await repository.findByTokenHashWithUser(
                    refreshToken.tokenHash,
                );

            expect(found).toBeNull();

        });

    });

    describe("findActiveByUserId", () => {

        it("should return an active and non-expired token", async () => {

            const { user, refreshToken } =
                await helper.createFakeUserWithRefreshToken(
                    {},
                    {
                        expiresAt: new Date(
                            Date.now() + 60 * 60 * 1000,
                        ),
                    },
                );

            const found =
                await repository.findActiveByUserId(
                    user.id,
                );

            expect(found).not.toBeNull();

            expect(found?.id).toBe(
                refreshToken.id,
            );

            expect(found?.userId).toBe(
                user.id,
            );

        });

        it("should not return a revoked token", async () => {

            const { user } =
                await helper.createFakeUserWithRefreshToken(
                    {},
                    {
                        revokedAt: new Date(),
                    },
                );

            const found =
                await repository.findActiveByUserId(
                    user.id,
                );

            expect(found).toBeNull();

        });

        it("should not return an expired token", async () => {

            const { user } =
                await helper.createFakeUserWithRefreshToken(
                    {},
                    {
                        expiresAt: new Date(
                            Date.now() - 1000,
                        ),
                    },
                );

            const found =
                await repository.findActiveByUserId(
                    user.id,
                );

            expect(found).toBeNull();

        });

        it("should return null when user has no active token", async () => {

            const user =
                await helper.createFakeUser();

            await helper.userRepository.create(user);

            const found =
                await repository.findActiveByUserId(
                    user.id,
                );

            expect(found).toBeNull();

        });

    });

    describe("update", () => {

        it("should update the token and increment version", async () => {

            const { refreshToken } =
                await helper.createFakeUserWithRefreshToken();

            const updatedData: RefreshTokenEntity = {
                ...refreshToken,

                revokedAt: new Date(),

                version: refreshToken.version,
            };

            const updated =
                await repository.update(
                    updatedData,
                );

            expect(updated).toBeDefined();

            expect(updated.id).toBe(
                refreshToken.id,
            );

            expect(updated.revokedAt).not.toBeNull();

            expect(updated.version).toBe(
                refreshToken.version + 1,
            );

            expect(
                new Date(updated.updatedAt).getTime(),
            ).toBeGreaterThanOrEqual(
                new Date(
                    refreshToken.updatedAt,
                ).getTime(),
            );

        });

    });

    describe("revokeAllByUserId", () => {

        it("should revoke all active tokens belonging to the user", async () => {

            const user =
                await helper.createFakeUser();

            const createdUser =
                await helper.userRepository.create(user);

            const token1 =
                await helper.createFakeRefreshToken({
                    userId: createdUser.id,
                });

            const token2 =
                await helper.createFakeRefreshToken({
                    userId: createdUser.id,
                });

            await repository.create(token1);

            await repository.create(token2);

            const revoked =
                await repository.revokeAllByUserId(
                    createdUser.id,
                );

            expect(revoked).toBe(2);

            const found1 =
                await repository.findById(token1.id);

            const found2 =
                await repository.findById(token2.id);

            expect(found1?.revokedAt).not.toBeNull();

            expect(found2?.revokedAt).not.toBeNull();

        });

        it("should return zero when user has no active tokens", async () => {

            const user =
                await helper.createFakeUser();

            const createdUser =
                await helper.userRepository.create(user);

            const revoked =
                await repository.revokeAllByUserId(
                    createdUser.id,
                );

            expect(revoked).toBe(0);

        });

        it("should only revoke active tokens", async () => {

            const user =
                await helper.createFakeUser();

            const createdUser =
                await helper.userRepository.create(user);

            const activeToken =
                await helper.createFakeRefreshToken({
                    userId: createdUser.id,
                });

            const revokedToken =
                await helper.createFakeRefreshToken({
                    userId: createdUser.id,
                    revokedAt: new Date(),
                });

            await repository.create(activeToken);

            await repository.create(revokedToken);

            const revoked =
                await repository.revokeAllByUserId(
                    createdUser.id,
                );

            expect(revoked).toBe(1);

        });

    });

    describe("deleteByIdAndCount", () => {

        it("should return 1 when token exists", async () => {

            const { refreshToken } =
                await helper.createFakeUserWithRefreshToken();

            const count =
                await repository.deleteByIdAndCount(
                    refreshToken.id,
                );

            expect(count).toBe(1);

            const found =
                await repository.findById(
                    refreshToken.id,
                );

            expect(found).toBeNull();

        });

        it("should return 0 when token does not exist", async () => {

            const count =
                await repository.deleteByIdAndCount(
                    helper.generateUuid(),
                );

            expect(count).toBe(0);

        });

    });

    describe("deleteExpired", () => {

        it("should delete expired tokens", async () => {

            const user =
                await helper.createFakeUser();

            const createdUser =
                await helper.userRepository.create(user);

            const expiredToken =
                await helper.createFakeRefreshToken({
                    userId: createdUser.id,

                    expiresAt: new Date(
                        Date.now() - 60 * 1000,
                    ),
                });

            const validToken =
                await helper.createFakeRefreshToken({
                    userId: createdUser.id,

                    expiresAt: new Date(
                        Date.now() + 60 * 60 * 1000,
                    ),
                });

            await repository.create(expiredToken);

            await repository.create(validToken);

            const deleted =
                await repository.deleteExpired();

            expect(deleted).toBeGreaterThanOrEqual(1);

            const expiredFound =
                await repository.findById(
                    expiredToken.id,
                );

            const validFound =
                await repository.findById(
                    validToken.id,
                );

            expect(expiredFound).toBeNull();

            expect(validFound).not.toBeNull();

        });

        it("should return 0 when there are no expired tokens", async () => {

            const user =
                await helper.createFakeUser();

            const createdUser =
                await helper.userRepository.create(user);

            const validToken =
                await helper.createFakeRefreshToken({
                    userId: createdUser.id,

                    expiresAt: new Date(
                        Date.now() + 60 * 60 * 1000,
                    ),
                });

            await repository.create(validToken);

            const deleted =
                await repository.deleteExpired();

            expect(deleted).toBe(0);

        });

    });

});