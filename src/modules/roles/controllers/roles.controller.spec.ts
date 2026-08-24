import {
    HttpStatus,
    INestApplication,
} from "@nestjs/common";

import request from "supertest";
import { randomUUID } from "node:crypto";

import { BaseIntegrationTest } from "../../../../test/helpers/base-test.helper";
import { BaseTestHelper } from "../../../../test/helpers/integration-test.helper";

import { ResponseHTTP } from "src/utils/http/responseHttp.res";

describe("RoleController (Integration Test)", () => {

    let app: INestApplication;
    let helper: BaseTestHelper;

    const path = "/v1/roles";

    beforeAll(async () => {
        await BaseIntegrationTest.setupAll();

        app = BaseIntegrationTest.getApp();
        helper = new BaseTestHelper(app);
    }, 180000);

    afterAll(async () => {
        await BaseIntegrationTest.teardownAll();
    });

    describe("GET /v1/roles/:id", () => {

        it("should find role by id", async () => {
            const { tokens } = await helper.createUserHTTP();
            const role = await helper.createRole();
            const idempotencyKey = randomUUID();

            const res = await request(
                app.getHttpServer(),
            )
                .get(`${path}/${role.id}`)
                .set(
                    "x-idempotency-key",
                    idempotencyKey,
                )
                .set(
                    "Authorization",
                    `Bearer ${tokens.token}`,
                );

            expect(res.status)
                .toBe(HttpStatus.OK);

            const response =
                res.body as ResponseHTTP<any>;

            expect(response).toMatchObject({
                status: true,
                method: "GET",
                path: `${path}/${role.id}`,
            });

            expect(response.timestamp)
                .toBeDefined();

            expect(response.traceId)
                .toBeDefined();

            expect(response.body)
                .toMatchObject({
                    id: role.id,
                    name: role.name,
                    description: role.description,
                    isActive: role.isActive,
                    version: role.version,
                });
        });


        it("should return 404 when role does not exist", async () => {
            const { tokens } = await helper.createUserHTTP();

            const id = randomUUID();
            const idempotencyKey = randomUUID();

            const res = await request(
                app.getHttpServer(),
            )
                .get(`${path}/${id}`)
                .set(
                    "x-idempotency-key",
                    idempotencyKey,
                )
                .set(
                    "Authorization",
                    `Bearer ${tokens.token}`,
                );

            expect(res.status)
                .toBe(HttpStatus.NOT_FOUND);

            const response =
                res.body as ResponseHTTP<null>;

            expect(response).toMatchObject({
                status: false,
                method: "GET",
                path: `${path}/${id}`,
                body: null,
            });

            expect(response.message)
                .toBe("Role not found");

            expect(response.timestamp)
                .toBeDefined();

            expect(response.traceId)
                .toBeDefined();
        });


        it("should return 400 when id is not a valid UUID", async () => {
            const { tokens } = await helper.createUserHTTP();
            const idempotencyKey = randomUUID();

            const id = "invalid-id";

            const res = await request(
                app.getHttpServer(),
            )
                .get(`${path}/${id}`)
                .set(
                    "x-idempotency-key",
                    idempotencyKey,
                )
                .set(
                    "Authorization",
                    `Bearer ${tokens.token}`,
                );

            expect(res.status)
                .toBe(HttpStatus.BAD_REQUEST);

            const response =
                res.body as ResponseHTTP<null>;

            expect(response).toMatchObject({
                status: false,
                method: "GET",
                path: `${path}/${id}`,
                body: null,
            });

            expect(response.message)
                .toBe("Id should be a UUID");

            expect(response.timestamp)
                .toBeDefined();

            expect(response.traceId)
                .toBeDefined();
        });


        it("should return 401 when authorization header is missing", async () => {
            const role = await helper.createRole();

            const res = await request(
                app.getHttpServer(),
            )
                .get(`${path}/${role.id}`);

            expect(res.status)
                .toBe(HttpStatus.UNAUTHORIZED);

            const response =
                res.body as ResponseHTTP<null>;

            expect(response.status)
                .toBe(false);

            expect(response.method)
                .toBe("GET");

            expect(response.path)
                .toBe(`${path}/${role.id}`);

            expect(response.body)
                .toBeNull();

            expect(response.message)
                .toBe("Token not found");

            expect(response.timestamp)
                .toBeDefined();

            expect(response.traceId)
                .toBeDefined();
        });


        it("should return 401 when token is invalid", async () => {
            const role = await helper.createRole();

            const res = await request(
                app.getHttpServer(),
            )
                .get(`${path}/${role.id}`)
                .set(
                    "Authorization",
                    "Bearer invalid-token",
                );

            expect(res.status)
                .toBe(HttpStatus.UNAUTHORIZED);

            const response =
                res.body as ResponseHTTP<null>;

            expect(response.status)
                .toBe(false);

            expect(response.method)
                .toBe("GET");

            expect(response.path)
                .toBe(`${path}/${role.id}`);

            expect(response.body)
                .toBeNull();

            expect(response.message)
                .toBe("Token invalid or expired");

            expect(response.timestamp)
                .toBeDefined();

            expect(response.traceId)
                .toBeDefined();
        });

    });

});