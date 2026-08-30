import { HttpStatus, INestApplication } from "@nestjs/common";
import { BaseIntegrationTest } from "../../../../test/helpers/base-test.helper";
import { BaseTestHelper } from "../../../../test/helpers/integration-test.helper";
import request from "supertest";
import { randomUUID } from "crypto";
import { ResponseHTTP } from "src/utils/http/responseHttp.res";

describe("UserRoleController (Integration Test)", () => {

    let app: INestApplication;
    let helper: BaseTestHelper;

    const path = "/v1/user-role";

    beforeAll(async () => {
        await BaseIntegrationTest.setupAll();

        app = BaseIntegrationTest.getApp();
        helper = new BaseTestHelper(app);
    }, 180000);

    afterAll(async () => {
        await BaseIntegrationTest.teardownAll();
    });

    describe("GET /v1/user-role/exists/:userId/:roleId", () => {

        it("should return true when user role association exists", async () => {
            const { tokens } = await helper.createUserHTTP();
            const role = await helper.createRole();
            
            await helper.createUserRole({
                userId: tokens.user.id,
                roleId: role.id,
            });

            const idempotencyKey = randomUUID();

            const res = await request(app.getHttpServer())
                .get(`${path}/exists/${tokens.user.id}/${role.id}`)
                .set("x-idempotency-key", idempotencyKey)
                .set("Authorization", `Bearer ${tokens.token}`);

            expect(res.status).toBe(HttpStatus.OK);

            const response = res.body as ResponseHTTP<boolean>;

            expect(response).toMatchObject({
                status: true,
                method: "GET",
                path: `${path}/exists/${tokens.user.id}/${role.id}`,
                body: true,
            });

            expect(response.timestamp).toBeDefined();
            expect(response.traceId).toBeDefined();
        });

        it("should return false when user role association does not exist", async () => {
            const { tokens } = await helper.createUserHTTP();
            const role = await helper.createRole();
            const idempotencyKey = randomUUID();

            const res = await request(app.getHttpServer())
                .get(`${path}/exists/${tokens.user.id}/${role.id}`)
                .set("x-idempotency-key", idempotencyKey)
                .set("Authorization", `Bearer ${tokens.token}`);

            expect(res.status).toBe(HttpStatus.OK);

            const response = res.body as ResponseHTTP<boolean>;

            expect(response).toMatchObject({
                status: true,
                method: "GET",
                path: `${path}/exists/${tokens.user.id}/${role.id}`,
                body: false,
            });

            expect(response.timestamp).toBeDefined();
            expect(response.traceId).toBeDefined();
        });

        it("should return 400 when userId or roleId is not a valid UUID", async () => {
            const { tokens } = await helper.createUserHTTP();
            const invalidId = "invalid-uuid";
            const role = await helper.createRole();
            const idempotencyKey = randomUUID();

            const res = await request(app.getHttpServer())
                .get(`${path}/exists/${invalidId}/${role.id}`)
                .set("x-idempotency-key", idempotencyKey)
                .set("Authorization", `Bearer ${tokens.token}`);

            expect(res.status).toBe(HttpStatus.BAD_REQUEST);

            const response = res.body as ResponseHTTP<null>;

            expect(response).toMatchObject({
                status: false,
                method: "GET",
                path: `${path}/exists/${invalidId}/${role.id}`,
                body: null,
            });

            expect(response.message).toBe("UserId should be a UUID");
            expect(response.timestamp).toBeDefined();
            expect(response.traceId).toBeDefined();
            expect(response.traceId).toBe(idempotencyKey);
        });

        it("should return 401 when authorization header is missing", async () => {
            const userId = helper.generateUuid();
            const roleId = helper.generateUuid();

            const res = await request(app.getHttpServer())
                .get(`${path}/exists/${userId}/${roleId}`);

            expect(res.status).toBe(HttpStatus.UNAUTHORIZED);

            const response = res.body as ResponseHTTP<null>;

            expect(response.status).toBe(false);
            expect(response.method).toBe("GET");
            expect(response.path).toBe(`${path}/exists/${userId}/${roleId}`);
            expect(response.body).toBeNull();
            expect(response.message).toBe("Token not found");
            expect(response.timestamp).toBeDefined();
            expect(response.traceId).toBeDefined();
        });

        it("should return 401 when token is invalid", async () => {
            const userId = helper.generateUuid();
            const roleId = helper.generateUuid();

            const res = await request(app.getHttpServer())
                .get(`${path}/exists/${userId}/${roleId}`)
                .set("Authorization", "Bearer invalid-token");

            expect(res.status).toBe(HttpStatus.UNAUTHORIZED);

            const response = res.body as ResponseHTTP<null>;

            expect(response.status).toBe(false);
            expect(response.method).toBe("GET");
            expect(response.path).toBe(`${path}/exists/${userId}/${roleId}`);
            expect(response.body).toBeNull();
            expect(response.message).toBe("Token invalid or expired");
            expect(response.timestamp).toBeDefined();
            expect(response.traceId).toBeDefined();
        });

    });

});