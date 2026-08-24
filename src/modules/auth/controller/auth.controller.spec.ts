import { HttpStatus, INestApplication } from "@nestjs/common";
import { CreateUserDto } from "src/modules/user/dto/create-user.dto";
import { BaseIntegrationTest } from "../../../../test/helpers/base-test.helper";
import { BaseTestHelper } from "../../../../test/helpers/integration-test.helper";
import { Tokens } from "../classes/token.class";
import { ResponseHTTP } from "src/utils/http/responseHttp.res";
import request from 'supertest';
import { randomUUID } from "crypto";
import { LoginUserDto } from "../dto/request/login-user.requests";

describe('UserRepository (Integration Test)', () => {
    let app: INestApplication;
    let helper: BaseTestHelper;
    const pathMain = "/v1/auth";
    
    beforeAll(async () => {
        await BaseIntegrationTest.setupAll();

        app = BaseIntegrationTest.getApp();
        helper = new BaseTestHelper(app);
    }, 180000);

    afterAll(async () => {
        await BaseIntegrationTest.teardownAll();
    });

    describe("/register", () => {
        const path = `${pathMain}/register`;

        it("should register a new user", async () => {
            await helper.createUserHTTP();
        });

    });

    describe("/login", () => {

        const path = `${pathMain}/login`;

        it("should login an existing user", async () => {

            const { dto, tokens } =
                await helper.createUserHTTP();

            const idempotencyKey = randomUUID();

            const loginDto: LoginUserDto = {
                email: tokens.user.email,
                password: dto.password,
            };

            const res = await request(app.getHttpServer())
                .post(path)
                .set("x-idempotency-key", idempotencyKey)
                .send(loginDto);

            const response =
                res.body as ResponseHTTP<Tokens>;

            expect(res.status).toBe(HttpStatus.OK);

            expect(response).toMatchObject({
                status: true,
                path,
                method: "POST",
            });

            expect(response.traceId).toBe(idempotencyKey);
            expect(response.timestamp).toBeDefined();

            expect(response.body).toBeDefined();

            expect(response.body.user).toMatchObject({
                id: tokens.user.id,
                name: dto.name,
                fullName: dto.fullName,
                email: dto.email,
            });

            expect(response.body.token).toBeDefined();
            expect(response.body.token).not.toBe("");

            expect(response.body.refreshToken).toBeDefined();
            expect(response.body.refreshToken).not.toBe("");

            expect(response.body.tokenExp).toBeDefined();
            expect(response.body.refreshTokenExp).toBeDefined();

            expect(response.body.roles).toEqual([]);
        });

        it("should reject login with unknown email", async () => {

            const loginDto = {
                email: "does-not-exist@example.com",
                password: "12345678",
            };

            const idempotencyKey = randomUUID();

            const res = await request(app.getHttpServer())
                .post(path)
                .set("x-idempotency-key", idempotencyKey)
                .send(loginDto);

            expect(res.status).toBe(HttpStatus.UNAUTHORIZED);

            const response =
                res.body as ResponseHTTP<null>;

            expect(response.status).toBe(false);
            expect(response.traceId).toBe(idempotencyKey);
            expect(response.body).toBeNull();
        });

        it("should reject login with invalid password", async () => {

            const { dto } =
                await helper.createUserHTTP();

            const loginDto = {
                email: dto.email,
                password: "wrong-password",
            };

            const res = await request(app.getHttpServer())
                .post(path)
                .set("x-idempotency-key", randomUUID())
                .send(loginDto);

            expect(res.status).toBe(HttpStatus.UNAUTHORIZED);

            const response =
                res.body as ResponseHTTP<null>;

            expect(response.status).toBe(false);
            expect(response.body).toBeNull();
        });

        it("should reject invalid email", async () => {

            const loginDto = {
                email: "not-an-email",
                password: "12345678",
            };

            const res = await request(app.getHttpServer())
                .post(path)
                .set("x-idempotency-key", randomUUID())
                .send(loginDto);

            expect(res.status).toBe(HttpStatus.BAD_REQUEST);

            const response =
                res.body as ResponseHTTP<null>;

            expect(response.status).toBe(false);
        });

    });

    describe("/rotate/:token", () => {

        const path = `${pathMain}/rotate`;

        it("should rotate refresh token", async () => {

            const { tokens } = await helper.createUserHTTP();

            const refreshToken = tokens.refreshToken;

            const idempotencyKey = randomUUID();

            const res = await request(app.getHttpServer())
                .get(`${path}/${encodeURIComponent(refreshToken)}`)
                .set("x-idempotency-key", idempotencyKey);

            const response =
                res.body as ResponseHTTP<Tokens>;

            expect(res.status).toBe(HttpStatus.OK);

            expect(response).toMatchObject({
                status: true,
                method: "GET",
            });

            expect(response.traceId).toBe(idempotencyKey);
            expect(response.timestamp).toBeDefined();

            expect(response.body).toBeDefined();

            expect(response.body.user).toMatchObject({
                id: tokens.user.id,
                name: tokens.user.name,
                fullName: tokens.user.fullName,
                email: tokens.user.email,
            });

            expect(response.body.token).toBeDefined();
            expect(response.body.token).not.toBe("");

            expect(response.body.refreshToken).toBeDefined();
            expect(response.body.refreshToken).not.toBe("");

            expect(response.body.tokenExp).toBeDefined();
            expect(response.body.refreshTokenExp).toBeDefined();

            expect(response.body.roles).toEqual([]);
        });


        it("should reject an invalid refresh token", async () => {

            const invalidToken =
                helper.generateRefreshToken();

            const idempotencyKey = randomUUID();

            const res = await request(app.getHttpServer())
                .get(`${path}/${invalidToken}`)
                .set("x-idempotency-key", idempotencyKey);

            const response =
                res.body as ResponseHTTP<null>;

            expect(res.status).toBe(HttpStatus.NOT_FOUND);

            expect(response.status).toBe(false);
            expect(response.body).toBeNull();
            expect(response.traceId).toBe(idempotencyKey);
        });


        it("should reject an expired refresh token", async () => {

            const { user, refreshToken } =
                await helper.createFakeUserWithRefreshToken({
                    id: randomUUID(),
                }, {
                    expiresAt: new Date(Date.now() - 1000),
                });

            // Aqui existe uma particularidade:
            // createFakeRefreshToken() salva o HASH do token,
            // então precisamos ter o token original para chamar a API.
        });


    });


});