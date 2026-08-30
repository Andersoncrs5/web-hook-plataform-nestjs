import {
    HttpStatus,
    INestApplication,
} from "@nestjs/common";

import request from "supertest";
import { randomUUID } from "node:crypto";

import { BaseIntegrationTest } from "../../../../test/helpers/base-test.helper";
import { BaseTestHelper } from "../../../../test/helpers/integration-test.helper";

import { ResponseHTTP } from "src/utils/http/responseHttp.res";
import { User } from "src/modules/user/entities/user.entity";

describe("UserController (Integration Test)", () => {

    let app: INestApplication;
    let helper: BaseTestHelper;

    const path = "/v1/user";

    beforeAll(async () => {
        await BaseIntegrationTest.setupAll();

        app = BaseIntegrationTest.getApp();
        helper = new BaseTestHelper(app);
    }, 180000);

    afterAll(async () => {
        await BaseIntegrationTest.teardownAll();
    });

    describe("GET /v1/user (findAll)", () => {
        it("should return 401 Unauthorized when request is not authenticated", async () => {
            const response = await request(app.getHttpServer())
                .get(path)
                .set(
                    "x-idempotency-key",
                    randomUUID(),
                )
                .expect(HttpStatus.UNAUTHORIZED);

            expect(response.body).toBeDefined();
        });

        it("should return list of users when authenticated (Happy Path)", async () => {
            const auth = await helper.createUserHTTP();
            const user = auth.tokens.user;

            const response = await request(app.getHttpServer())
                .get(path)
                .set("Authorization", `Bearer ${auth.tokens.token}`)
                .query({ page: 0, size: 10 })
                .set(
                    "x-idempotency-key",
                    randomUUID(),
                )
                .expect(HttpStatus.OK);

            expect(response.body).toBeDefined();
        });
    });

    describe("DELETE /v1/user (delete)", () => {
        it("should return 401 Unauthorized when request is not authenticated", async () => {
            const idempotencyKey = randomUUID()

            await request(app.getHttpServer())
                .delete(path)
                .set(
                    "x-idempotency-key",
                    idempotencyKey,
                )
                .expect(HttpStatus.UNAUTHORIZED);
        });

        it("should delete authenticated user successfully (Happy Path)", async () => {
            const auth = await helper.createUserHTTP();
            const user = auth.tokens.user;
            const idempotencyKey = randomUUID()

            const response = await request(app.getHttpServer())
                .delete(path)
                .set(
                    "x-idempotency-key",
                    idempotencyKey,
                )
                .set("Authorization", `Bearer ${auth.tokens.token}`)
                .expect(HttpStatus.OK);

            expect(response.body).toBeDefined();
        });
    });

    describe("GET /v1/user/exists/email/:email", () => {
        it("should return true when email exists in database", async () => {
            const createdUser = await helper.createUser();
            const idempotencyKey = randomUUID()

            const response = await request(app.getHttpServer())
                .get(`${path}/exists/email/${createdUser.email}`)
                .set(
                    "x-idempotency-key",
                    idempotencyKey,
                )
                .expect(HttpStatus.OK);

            expect(response.body.body).toBe(true);
        });

        it("should return false when email does not exist in database", async () => {
            const nonExistentEmail = `nonexistent_${randomUUID()}@domain.com`;

            const response = await request(app.getHttpServer())
                .get(`${path}/exists/email/${nonExistentEmail}`)
                .set(
                    "x-idempotency-key",
                    randomUUID(),
                )
                .expect(HttpStatus.OK);

            expect(response.body.body).toBe(false);
        });

        it("should return 400 Bad Request when email format is invalid", async () => {
            const invalidEmail = "invalid-email-format";

            const response = await request(app.getHttpServer())
                .get(`${path}/exists/email/${invalidEmail}`)
                .set(
                    "x-idempotency-key",
                    randomUUID(),
                )
                .expect(HttpStatus.BAD_REQUEST);

            expect(response.body).toBeDefined();
        });
    });

    describe("GET /v1/user/exists/name/:name", () => {
        it("should return true when user name exists in database", async () => {
            const createdUser = await helper.createUser();

            const response = await request(app.getHttpServer())
                .get(`${path}/exists/name/${createdUser.name}`)
                .set(
                    "x-idempotency-key",
                    randomUUID(),
                )
                .expect(HttpStatus.OK);

            expect(response.body.body).toBe(true);
        });

        it("should return false when user name does not exist in database", async () => {
            const nonExistentName = `nonexistent_name_${randomUUID()}`;

            const response = await request(app.getHttpServer())
                .get(`${path}/exists/name/${nonExistentName}`)
                .set(
                    "x-idempotency-key",
                    randomUUID(),
                )
                .expect(HttpStatus.OK);

            expect(response.body.body).toBe(false);
        });
    });

    describe("PATCH /v1/user", () => {

        it("should update the authenticated user's name", async () => {

             const { tokens } =
                await helper.createUserHTTP();

            const user = tokens.user;

            const idempotencyKey = randomUUID();

            const newName =
                `Updated_${helper.getRandomString(12)}`;

            const res =
                await request(
                    app.getHttpServer(),
                )
                    .patch(path)
                    .set(
                        "Authorization",
                        `Bearer ${tokens.token}`,
                    )
                    .set(
                        "x-idempotency-key",
                        idempotencyKey,
                    )
                    .send({
                        name: newName,
                        password: "12345678",
                    });

            expect(res.status).toBe(
                HttpStatus.OK,
            );

            const response =
                res.body as ResponseHTTP<User>;

            expect(response.status).toBe(true);
            expect(response.method).toBe("PATCH");
            expect(response.path).toBe(path);
            expect(response.traceId).toBeDefined();
            expect(response.timestamp).toBeDefined();

            expect(response.body).toBeDefined();
            expect(response.body.name).toBe(newName);
            expect(response.body.id).toBe(user.id);

            const updated =
                await helper.userRepository.findById(
                    user.id,
                );

            expect(updated).not.toBeNull();
            expect(updated?.name).toBe(newName);
        });


        it("should update the authenticated user's full name", async () => {

             const { tokens } =
                await helper.createUserHTTP();

            const user = tokens.user;

            const idempotencyKey = randomUUID();

            const newFullName =
                `Updated Full Name ${helper.getRandomString(10)}`;

            const res =
                await request(
                    app.getHttpServer(),
                )
                    .patch(path)
                    .set(
                        "Authorization",
                        `Bearer ${tokens.token}`,
                    )
                    .set(
                        "x-idempotency-key",
                        idempotencyKey,
                    )
                    .send({
                        name: user.name,
                        fullName: newFullName,
                        password: "12345678",
                    });

            expect(res.status).toBe(
                HttpStatus.OK,
            );

            const response =
                res.body as ResponseHTTP<User>;

            expect(response.status).toBe(true);
            expect(response.body.fullName).toBe(
                newFullName,
            );

            const updated =
                await helper.userRepository.findById(
                    user.id,
                );

            expect(updated?.fullName).toBe(
                newFullName,
            );
        });


        it("should update multiple user fields", async () => {

             const { tokens } =
                await helper.createUserHTTP();

            const user = tokens.user;

            const idempotencyKey =
                randomUUID();

            const newName =
                `NewName_${helper.getRandomString(10)}`;

            const newFullName =
                `New Full Name ${helper.getRandomString(10)}`;

            const newPassword =
                "NewPassword123";

            const res =
                await request(
                    app.getHttpServer(),
                )
                    .patch(path)
                    .set(
                        "Authorization",
                        `Bearer ${tokens.token}`,
                    )
                    .set(
                        "x-idempotency-key",
                        idempotencyKey,
                    )
                    .send({
                        name: newName,
                        fullName: newFullName,
                        password: newPassword,
                    });

            expect(res.status).toBe(
                HttpStatus.OK,
            );

            const response =
                res.body as ResponseHTTP<User>;

            expect(response.status).toBe(true);
            expect(response.body.id).toBe(user.id);
            expect(response.body.name).toBe(
                newName,
            );
            expect(response.body.fullName).toBe(
                newFullName,
            );

            const updated =
                await helper.userRepository.findById(
                    user.id,
                );

            expect(updated?.name).toBe(
                newName,
            );

            expect(updated?.fullName).toBe(
                newFullName,
            );

            expect(
                updated?.passwordHash,
            ).not.toBe(
                user.passwordHash,
            );

            expect(
                await helper.verify(
                    updated!.passwordHash,
                    newPassword,
                ),
            ).toBe(true);

            expect(
                await helper.verify(
                    updated!.passwordHash,
                    "12345678",
                ),
            ).toBe(false);
        });


        it("should increment the user's version when updating", async () => {

            const { tokens } =
                await helper.createUserHTTP();

            const user = tokens.user;

            const before =
                await helper.userRepository.findById(
                    user.id,
                );

            expect(before).not.toBeNull();

            const idempotencyKey =
                randomUUID();

            const res =
                await request(
                    app.getHttpServer(),
                )
                    .patch(path)
                    .set(
                        "Authorization",
                        `Bearer ${tokens.token}`,
                    )
                    .set(
                        "x-idempotency-key",
                        idempotencyKey,
                    )
                    .send({
                        name:
                            `Version_${helper.getRandomString(10)}`,
                        password: "12345678",
                    });

            expect(res.status).toBe(
                HttpStatus.OK,
            );

            const after =
                await helper.userRepository.findById(
                    user.id,
                );

            expect(after).not.toBeNull();

            expect(after!.version).toBe(
                before!.version + 1,
            );
        });


        it("should return unauthorized when access token is missing", async () => {

            const res =
                await request(
                    app.getHttpServer(),
                )
                    .patch(path)
                    .send({
                        name:
                            "Unauthorized Update",
                        password: "12345678",
                    });

            expect(res.status).toBe(
                HttpStatus.UNAUTHORIZED,
            );
        });


        it("should return unauthorized when access token is invalid", async () => {

            const res =
                await request(
                    app.getHttpServer(),
                )
                    .patch(path)
                    .set(
                        "Authorization",
                        "Bearer invalid-token",
                    )
                    .send({
                        name:
                            "Invalid Token Update",
                        password: "12345678",
                    });

            expect(res.status).toBe(
                HttpStatus.UNAUTHORIZED,
            );
        });

        it("should reject a request with an invalid name type", async () => {

            const { tokens } =
                await helper.createUserHTTP();

            const res =
                await request(
                    app.getHttpServer(),
                )
                    .patch(path)
                    .set(
                        "Authorization",
                        `Bearer ${tokens.token}`,
                    )
                    .set(
                        "x-idempotency-key",
                        randomUUID(),
                    )
                    .send({
                        name: 123456,
                        password: "12345678",
                    });

            expect(res.status).toBe(
                HttpStatus.BAD_REQUEST,
            );
        });


        it("should reject a request with an invalid password type", async () => {

            const { tokens } =
                await helper.createUserHTTP();

            const res =
                await request(
                    app.getHttpServer(),
                )
                    .patch(path)
                    .set(
                        "Authorization",
                        `Bearer ${tokens.token}`,
                    )
                    .set(
                        "x-idempotency-key",
                        randomUUID(),
                    )
                    .send({
                        name:
                            `ValidName_${helper.getRandomString(10)}`,
                        password: 12345678,
                    });

            expect(res.status).toBe(
                HttpStatus.BAD_REQUEST,
            );
        });


        it("should not update another user's data", async () => {

            const first =
                await helper.createUserHTTP();

            const second =
                await helper.createUserHTTP();

            const newName =
                `Changed_${helper.getRandomString(10)}`;

            const res =
                await request(
                    app.getHttpServer(),
                )
                    .patch(path)
                    .set(
                        "Authorization",
                        `Bearer ${first.tokens.token}`,
                    )
                    .set(
                        "x-idempotency-key",
                        randomUUID(),
                    )
                    .send({
                        name: newName,
                        password: "12345678",
                    });

            expect(res.status).toBe(
                HttpStatus.OK,
            );

            const firstUser =
                await helper.userRepository.findById(
                    first.tokens.user.id,
                );

            const secondUser =
                await helper.userRepository.findById(
                    second.tokens.user.id,
                );

            expect(firstUser?.name).toBe(
                newName,
            );

            expect(secondUser?.name).toBe(
                second.tokens.user.name,
            );
        });


        it("should preserve fields that were not changed", async () => {

            const { tokens } =
                await helper.createUserHTTP();

            const user = tokens.user;

            const originalEmail =
                user.email;

            const originalFullName =
                user.fullName;

            const newName =
                `OnlyName_${helper.getRandomString(10)}`;

            const res =
                await request(
                    app.getHttpServer(),
                )
                    .patch(path)
                    .set(
                        "Authorization",
                        `Bearer ${tokens.token}`,
                    )
                    .set(
                        "x-idempotency-key",
                        randomUUID(),
                    )
                    .send({
                        name: newName,
                        password: "12345678",
                    });

            expect(res.status).toBe(
                HttpStatus.OK,
            );

            const updated =
                await helper.userRepository.findById(
                    user.id,
                );

            expect(updated?.name).toBe(
                newName,
            );

            expect(updated?.email).toBe(
                originalEmail,
            );

            expect(updated?.fullName).toBe(
                originalFullName,
            );
        });

    });
});