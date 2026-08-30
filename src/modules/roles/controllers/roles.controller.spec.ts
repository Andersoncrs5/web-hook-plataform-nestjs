import {
    HttpStatus,
    INestApplication,
} from "@nestjs/common";

import request from "supertest";
import { randomUUID } from "node:crypto";

import { BaseIntegrationTest } from "../../../../test/helpers/base-test.helper";
import { BaseTestHelper } from "../../../../test/helpers/integration-test.helper";

import { ResponseHTTP } from "src/utils/http/responseHttp.res";
import { Tokens } from "src/modules/auth/classes/token.class";
import { LoginUserDto } from "src/modules/auth/dto/request/login-user.requests";
import { CreateRoleDto } from "../dto/create-role.dto";
import { Role } from "../entities/role.entity";
import { UpdateRoleDto } from "../dto/update-role.dto";

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

    describe("GET /v1/roles/exists/name/:name", () => {

        it("should return true when role exists by name", async () => {
            const { tokens } = await helper.createUserHTTP();
            const role = await helper.createRole();
            const idempotencyKey = randomUUID();

            const res = await request(
                app.getHttpServer(),
            )
                .get(`${path}/exists/name/${role.name}`)
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
                res.body as ResponseHTTP<boolean>;

            expect(response).toMatchObject({
                status: true,
                method: "GET",
                path: `${path}/exists/name/${role.name}`,
                body: true,
            });

            expect(response.timestamp)
                .toBeDefined();

            expect(response.traceId)
                .toBeDefined();
        });


        it("should return false when role does not exist by name", async () => {
            const { tokens } = await helper.createUserHTTP();
            const nonExistingName = `role-${helper.getRandomString(10)}`;
            const idempotencyKey = randomUUID();

            const res = await request(
                app.getHttpServer(),
            )
                .get(`${path}/exists/name/${nonExistingName}`)
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
                res.body as ResponseHTTP<boolean>;

            expect(response).toMatchObject({
                status: true,
                method: "GET",
                path: `${path}/exists/name/${nonExistingName}`,
                body: false,
            });

            expect(response.timestamp)
                .toBeDefined();

            expect(response.traceId)
                .toBeDefined();
        });


        it("should return 401 when authorization header is missing", async () => {
            const roleName = "admin";

            const res = await request(
                app.getHttpServer(),
            )
                .get(`${path}/exists/name/${roleName}`);

            expect(res.status)
                .toBe(HttpStatus.UNAUTHORIZED);

            const response =
                res.body as ResponseHTTP<null>;

            expect(response.status)
                .toBe(false);

            expect(response.method)
                .toBe("GET");

            expect(response.path)
                .toBe(`${path}/exists/name/${roleName}`);

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
            const roleName = "admin";

            const res = await request(
                app.getHttpServer(),
            )
                .get(`${path}/exists/name/${roleName}`)
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
                .toBe(`${path}/exists/name/${roleName}`);

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

    describe("POST /v1/roles create role", () => {
        it("should create role successfully", async () => {
            const key = helper.getRandomString(20);
            const idempotencyKey = randomUUID();

            const tokens: {
                dto: LoginUserDto;
                tokens: Tokens;
            } = await helper.loginMasterHTTP();

            const dto: CreateRoleDto = {
                name: `role-${key}`,
                description: "Desc any",
            };

            const res = await request(app.getHttpServer())
                .post(path)
                .set(
                    "Authorization",
                    `Bearer ${tokens.tokens.token}`,
                )
                .set("x-idempotency-key", idempotencyKey)
                .send(dto);

            expect(res.status).toBe(HttpStatus.CREATED);

            const response = res.body as ResponseHTTP<Role>;

            expect(response.status).toBe(true);
            expect(response.method).toBe("POST");
            expect(response.path).toBe(path);
            expect(response.body).toMatchObject({
                name: dto.name,
                description: dto.description,
                isActive: true,
            });
            expect(response.body.id).toBeDefined();
        });

        it("should return 409 when role name already exists", async () => {
            const role = await helper.createRole();
            const idempotencyKey = randomUUID();

            const tokens = await helper.loginMasterHTTP();

            const dto: CreateRoleDto = {
                name: role.name,
                description: "Duplicate role attempt",
            };

            const res = await request(app.getHttpServer())
                .post(path)
                .set(
                    "Authorization",
                    `Bearer ${tokens.tokens.token}`,
                )
                .set("x-idempotency-key", idempotencyKey)
                .send(dto);

            expect(res.status).toBe(HttpStatus.CONFLICT);

            const response = res.body as ResponseHTTP<null>;
            expect(response.status).toBe(false);
            expect(response.message).toContain(`Name "${dto.name}" already exists.`);
        });

        it("should return 400 when name field is missing", async () => {
            const idempotencyKey = randomUUID();
            const tokens = await helper.loginMasterHTTP();

            const dto = {
                description: "Role without name",
            };

            const res = await request(app.getHttpServer())
                .post(path)
                .set(
                    "Authorization",
                    `Bearer ${tokens.tokens.token}`,
                )
                .set("x-idempotency-key", idempotencyKey)
                .send(dto);

            expect(res.status).toBe(HttpStatus.BAD_REQUEST);

            const response = res.body as ResponseHTTP<null>;
            expect(response.status).toBe(false);
        });

        it("should return 400 when name exceeds maximum length", async () => {
            const idempotencyKey = randomUUID();
            const tokens = await helper.loginMasterHTTP();

            const dto: CreateRoleDto = {
                name: "a".repeat(101),
                description: "Too long name",
            };

            const res = await request(app.getHttpServer())
                .post(path)
                .set(
                    "Authorization",
                    `Bearer ${tokens.tokens.token}`,
                )
                .set("x-idempotency-key", idempotencyKey)
                .send(dto);

            expect(res.status).toBe(HttpStatus.BAD_REQUEST);
        });

        it("should return 403 when user does not have ADMIN or MASTER role", async () => {
            const idempotencyKey = randomUUID();
            
            // Login com usuário comum (sem permissão ADMIN/MASTER)
            const { tokens } = await helper.createUserHTTP();

            const dto: CreateRoleDto = {
                name: `role-${helper.getRandomString(10)}`,
                description: "Unauthorized creation attempt",
            };

            const res = await request(app.getHttpServer())
                .post(path)
                .set(
                    "Authorization",
                    `Bearer ${tokens.token}`,
                )
                .set("x-idempotency-key", idempotencyKey)
                .send(dto);

            expect(res.status).toBe(HttpStatus.FORBIDDEN);

            const response = res.body as ResponseHTTP<null>;
            expect(response.status).toBe(false);
        });

        it("should return 401 when authorization header is missing on POST", async () => {
            const dto: CreateRoleDto = {
                name: `role-${helper.getRandomString(10)}`,
                description: "No token",
            };

            const res = await request(app.getHttpServer())
                .post(path)
                .send(dto);

            expect(res.status).toBe(HttpStatus.UNAUTHORIZED);
        });
    });

    describe("PATCH /v1/roles/:id update role", () => {
        it("should update role successfully", async () => {
            const role = await helper.createRole();
            const idempotencyKey = randomUUID();
            const tokens = await helper.loginMasterHTTP();

            const dto: UpdateRoleDto = {
                name: `updated-role-${helper.getRandomString(10)}`,
                description: "Updated role description",
                isActive: true,
            };

            const res = await request(app.getHttpServer())
                .patch(`${path}/${role.id}`)
                .set(
                    "Authorization",
                    `Bearer ${tokens.tokens.token}`,
                )
                .set("x-idempotency-key", idempotencyKey)
                .send(dto);

            expect(res.status).toBe(HttpStatus.OK);

            const response = res.body as ResponseHTTP<Role>;

            expect(response.status).toBe(true);
            expect(response.method).toBe("PATCH");
            expect(response.path).toBe(`${path}/${role.id}`);
            expect(response.body).toMatchObject({
                id: role.id,
                name: dto.name,
                description: dto.description,
                isActive: dto.isActive,
            });
            expect(response.timestamp).toBeDefined();
            expect(response.traceId).toBeDefined();
        });

        it("should return 404 when role to update does not exist", async () => {
            const id = randomUUID();
            const idempotencyKey = randomUUID();
            const tokens = await helper.loginMasterHTTP();

            const dto: UpdateRoleDto = {
                name: `role-${helper.getRandomString(10)}`,
            };

            const res = await request(app.getHttpServer())
                .patch(`${path}/${id}`)
                .set(
                    "Authorization",
                    `Bearer ${tokens.tokens.token}`,
                )
                .set("x-idempotency-key", idempotencyKey)
                .send(dto);

            expect(res.status).toBe(HttpStatus.NOT_FOUND);

            const response = res.body as ResponseHTTP<null>;
            expect(response.status).toBe(false);
            expect(response.method).toBe("PATCH");
            expect(response.path).toBe(`${path}/${id}`);
            expect(response.message).toBe("Role not found");
        });

        it("should return 400 when id is not a valid UUID", async () => {
            const invalidId = "invalid-uuid";
            const idempotencyKey = randomUUID();
            const tokens = await helper.loginMasterHTTP();

            const dto: UpdateRoleDto = {
                name: "Updated Name",
            };

            const res = await request(app.getHttpServer())
                .patch(`${path}/${invalidId}`)
                .set(
                    "Authorization",
                    `Bearer ${tokens.tokens.token}`,
                )
                .set("x-idempotency-key", idempotencyKey)
                .send(dto);

            expect(res.status).toBe(HttpStatus.BAD_REQUEST);

            const response = res.body as ResponseHTTP<null>;
            expect(response.status).toBe(false);
            expect(response.message).toBe("Id should be a UUID");
        });

        it("should return 409 when updated role name already belongs to another role", async () => {
            const existingRole = await helper.createRole();
            const targetRole = await helper.createRole();

            const idempotencyKey = randomUUID();
            const tokens = await helper.loginMasterHTTP();

            const dto: UpdateRoleDto = {
                name: existingRole.name,
            };

            const res = await request(app.getHttpServer())
                .patch(`${path}/${targetRole.id}`)
                .set(
                    "Authorization",
                    `Bearer ${tokens.tokens.token}`,
                )
                .set("x-idempotency-key", idempotencyKey)
                .send(dto);

            expect(res.status).toBe(HttpStatus.CONFLICT);

            const response = res.body as ResponseHTTP<null>;
            expect(response.status).toBe(false);
            expect(response.message).toBe(`Name "${dto.name}" already exists.`);
        });

        it("should return 400 when updated name exceeds maximum length", async () => {
            const role = await helper.createRole();
            const idempotencyKey = randomUUID();
            const tokens = await helper.loginMasterHTTP();

            const dto: UpdateRoleDto = {
                name: "a".repeat(101),
            };

            const res = await request(app.getHttpServer())
                .patch(`${path}/${role.id}`)
                .set(
                    "Authorization",
                    `Bearer ${tokens.tokens.token}`,
                )
                .set("x-idempotency-key", idempotencyKey)
                .send(dto);

            expect(res.status).toBe(HttpStatus.BAD_REQUEST);
        });

        it("should return 403 when user does not have ADMIN or MASTER role", async () => {
            const role = await helper.createRole();
            const idempotencyKey = randomUUID();
            const { tokens } = await helper.createUserHTTP();

            const dto: UpdateRoleDto = {
                name: `unauthorized-update-${helper.getRandomString(5)}`,
            };

            const res = await request(app.getHttpServer())
                .patch(`${path}/${role.id}`)
                .set(
                    "Authorization",
                    `Bearer ${tokens.token}`,
                )
                .set("x-idempotency-key", idempotencyKey)
                .send(dto);

            expect(res.status).toBe(HttpStatus.FORBIDDEN);

            const response = res.body as ResponseHTTP<null>;
            expect(response.status).toBe(false);
        });

        it("should return 401 when authorization header is missing", async () => {
            const role = await helper.createRole();

            const dto: UpdateRoleDto = {
                name: "Updated Without Token",
            };

            const res = await request(app.getHttpServer())
                .patch(`${path}/${role.id}`)
                .send(dto);

            expect(res.status).toBe(HttpStatus.UNAUTHORIZED);

            const response = res.body as ResponseHTTP<null>;
            expect(response.status).toBe(false);
            expect(response.message).toBe("Token not found");
        });
    });

    describe("DELETE /v1/roles/:id delete role", () => {
        it("should delete role successfully", async () => {
            const role = await helper.createRole();
            const idempotencyKey = randomUUID();
            const tokens = await helper.loginMasterHTTP();

            const res = await request(app.getHttpServer())
                .delete(`${path}/${role.id}`)
                .set(
                    "Authorization",
                    `Bearer ${tokens.tokens.token}`,
                )
                .set("x-idempotency-key", idempotencyKey);

            expect(res.status).toBe(HttpStatus.OK);

            const response = res.body as ResponseHTTP<null>;
            expect(response.status).toBe(true);
            expect(response.method).toBe("DELETE");
            expect(response.path).toBe(`${path}/${role.id}`);
            expect(response.timestamp).toBeDefined();
            expect(response.traceId).toBeDefined();
        });

        it("should return 404 when role to delete does not exist", async () => {
            const id = randomUUID();
            const idempotencyKey = randomUUID();
            const tokens = await helper.loginMasterHTTP();

            const res = await request(app.getHttpServer())
                .delete(`${path}/${id}`)
                .set(
                    "Authorization",
                    `Bearer ${tokens.tokens.token}`,
                )
                .set("x-idempotency-key", idempotencyKey);

            expect(res.status).toBe(HttpStatus.NOT_FOUND);

            const response = res.body as ResponseHTTP<null>;
            expect(response.status).toBe(false);
            expect(response.method).toBe("DELETE");
            expect(response.path).toBe(`${path}/${id}`);
            expect(response.message).toBe("Role not found");
        });

        it("should return 400 when id is not a valid UUID", async () => {
            const invalidId = "invalid-uuid";
            const idempotencyKey = randomUUID();
            const tokens = await helper.loginMasterHTTP();

            const res = await request(app.getHttpServer())
                .delete(`${path}/${invalidId}`)
                .set(
                    "Authorization",
                    `Bearer ${tokens.tokens.token}`,
                )
                .set("x-idempotency-key", idempotencyKey);

            expect(res.status).toBe(HttpStatus.BAD_REQUEST);

            const response = res.body as ResponseHTTP<null>;
            expect(response.status).toBe(false);
            expect(response.message).toBe("Id should be a UUID");
        });

        it("should return 403 when user does not have ADMIN or MASTER role", async () => {
            const role = await helper.createRole();
            const idempotencyKey = randomUUID();
            const { tokens } = await helper.createUserHTTP();

            const res = await request(app.getHttpServer())
                .delete(`${path}/${role.id}`)
                .set(
                    "Authorization",
                    `Bearer ${tokens.token}`,
                )
                .set("x-idempotency-key", idempotencyKey);

            expect(res.status).toBe(HttpStatus.FORBIDDEN);

            const response = res.body as ResponseHTTP<null>;
            expect(response.status).toBe(false);
        });

        it("should return 401 when authorization header is missing", async () => {
            const role = await helper.createRole();

            const res = await request(app.getHttpServer())
                .delete(`${path}/${role.id}`);

            expect(res.status).toBe(HttpStatus.UNAUTHORIZED);

            const response = res.body as ResponseHTTP<null>;
            expect(response.status).toBe(false);
            expect(response.message).toBe("Token not found");
        });
    });

});