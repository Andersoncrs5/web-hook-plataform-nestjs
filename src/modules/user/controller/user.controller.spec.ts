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


        it("should return bad request when name is empty", async () => {

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
                        name: "",
                        password: "12345678",
                    });

            expect(res.status).toBe(
                HttpStatus.BAD_REQUEST,
            );
        });


        it("should return bad request when password is empty", async () => {

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
                        password: "",
                    });

            expect(res.status).toBe(
                HttpStatus.BAD_REQUEST,
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