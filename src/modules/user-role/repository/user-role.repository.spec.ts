import { INestApplication } from "@nestjs/common";
import { BaseIntegrationTest } from "../../../../test/helpers/base-test.helper";
import { BaseTestHelper } from "../../../../test/helpers/integration-test.helper";

import { UserRoleRepository } from "src/modules/user-role/repository/user-role.repository";
import { UserRole } from "src/modules/user-role/entities/user-role.entity";
import { UserRoleSort } from "src/modules/user-role/dto/user-role-sort.dto";
import { Pageable, SortDirection } from "src/common/page/page";
import { Role } from "src/modules/roles/entities/role.entity";

describe("UserRoleRepository (Integration Test)", () => {

    let app: INestApplication;
    let helper: BaseTestHelper;
    let repository: UserRoleRepository;

    beforeAll(async () => {
        await BaseIntegrationTest.setupAll();

        app = BaseIntegrationTest.getApp();

        helper = new BaseTestHelper(app);

        repository = helper.userRoleRepository;
    }, 180000);

    afterAll(async () => {
        await BaseIntegrationTest.teardownAll();
    });

    describe("initialization", () => {

        it("should be defined", () => {
            expect(app).toBeDefined();
            expect(helper).toBeDefined();
            expect(repository).toBeDefined();
            expect(helper.userRepository).toBeDefined();
            expect(helper.roleRepository).toBeDefined();
        });

    });

    describe("create", () => {

        it("should create a user-role relationship successfully", async () => {

            const user = await helper.createFakeUser();
            const role = await helper.createFakeRole();

            const createdUser = await helper.userRepository.create(user);
            const createdRole = await helper.roleRepository.create(role);

            const userRole: UserRole = {
                id: helper.generateUuid(),
                userId: createdUser.id,
                roleId: createdRole.id,
                version: 0,
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: null,
            };

            const created = await repository.create(userRole);

            expect(created).toBeDefined();
            expect(created.id).toBe(userRole.id);
            expect(created.userId).toBe(createdUser.id);
            expect(created.roleId).toBe(createdRole.id);
            expect(created.version).toBe(0);
        });

    });

    describe("findById", () => {

        it("should return the user-role relationship when it exists", async () => {

            const user = await helper.userRepository.create(
                await helper.createFakeUser(),
            );

            const role = await helper.roleRepository.create(
                await helper.createFakeRole(),
            );

            const userRole = await repository.create({
                id: helper.generateUuid(),
                userId: user.id,
                roleId: role.id,
                version: 0,
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: null,
            });

            const found = await repository.findById(userRole.id);

            expect(found).not.toBeNull();
            expect(found?.id).toBe(userRole.id);
            expect(found?.userId).toBe(user.id);
            expect(found?.roleId).toBe(role.id);
        });

        it("should return null when the relationship does not exist", async () => {

            const id = helper.generateUuid();

            const found = await repository.findById(id);

            expect(found).toBeNull();
        });

    });

    describe("findAllByUserIdJustRoleId", () => {

        it("should return all role ids associated with a user", async () => {

            const user = await helper.userRepository.create(
                await helper.createFakeUser(),
            );

            const role1 = await helper.roleRepository.create(
                await helper.createFakeRole(),
            );

            const role2 = await helper.roleRepository.create(
                await helper.createFakeRole(),
            );

            await repository.create({
                id: helper.generateUuid(),
                userId: user.id,
                roleId: role1.id,
                version: 0,
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: null,
            });

            await repository.create({
                id: helper.generateUuid(),
                userId: user.id,
                roleId: role2.id,
                version: 0,
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: null,
            });

            const roleIds =
                await repository.findAllByUserIdJustRoleId(user.id);

            expect(roleIds).toHaveLength(2);
            expect(roleIds).toContain(role1.id);
            expect(roleIds).toContain(role2.id);
        });

        it("should return an empty array when user has no roles", async () => {

            const user = await helper.userRepository.create(
                await helper.createFakeUser(),
            );

            const roleIds =
                await repository.findAllByUserIdJustRoleId(user.id);

            expect(roleIds).toEqual([]);
        });

        it("should return an empty array for an unknown user", async () => {

            const roleIds =
                await repository.findAllByUserIdJustRoleId(
                    helper.generateUuid(),
                );

            expect(roleIds).toEqual([]);
        });

    });

    describe("existsByRoleIdAndUserId", () => {

        it("should return true when relationship exists", async () => {

            const user = await helper.userRepository.create(
                await helper.createFakeUser(),
            );

            const role = await helper.roleRepository.create(
                await helper.createFakeRole(),
            );

            await repository.create({
                id: helper.generateUuid(),
                userId: user.id,
                roleId: role.id,
                version: 0,
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: null,
            });

            const exists =
                await repository.existsByRoleIdAndUserId(
                    role.id,
                    user.id,
                );

            expect(exists).toBe(true);
        });

        it("should return false when relationship does not exist", async () => {

            const exists =
                await repository.existsByRoleIdAndUserId(
                    helper.generateUuid(),
                    helper.generateUuid(),
                );

            expect(exists).toBe(false);
        });

    });

    describe("findAllRoleNamesByUserId", () => {

        it("should return all role names associated with a user", async () => {

            const user = await helper.userRepository.create(
                await helper.createFakeUser(),
            );

            const role1 = await helper.roleRepository.create(
                await helper.createFakeRole(),
            );

            const role2 = await helper.roleRepository.create(
                await helper.createFakeRole(),
            );

            await repository.create({
                id: helper.generateUuid(),
                userId: user.id,
                roleId: role1.id,
                version: 0,
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: null,
            });

            await repository.create({
                id: helper.generateUuid(),
                userId: user.id,
                roleId: role2.id,
                version: 0,
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: null,
            });

            const names =
                await repository.findAllRoleNamesByUserId(user.id);

            expect(names).toHaveLength(2);
            expect(names).toContain(role1.name);
            expect(names).toContain(role2.name);
        });

        it("should return an empty array when user has no roles", async () => {

            const user = await helper.userRepository.create(
                await helper.createFakeUser(),
            );

            const names =
                await repository.findAllRoleNamesByUserId(user.id);

            expect(names).toEqual([]);
        });

    });

    describe("findAllRolesByUserId", () => {

        it("should return all roles associated with a user", async () => {

            const user = await helper.userRepository.create(
                await helper.createFakeUser(),
            );

            const role1 = await helper.roleRepository.create(
                await helper.createFakeRole(),
            );

            const role2 = await helper.roleRepository.create(
                await helper.createFakeRole(),
            );

            await repository.create({
                id: helper.generateUuid(),
                userId: user.id,
                roleId: role1.id,
                version: 0,
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: null,
            });

            await repository.create({
                id: helper.generateUuid(),
                userId: user.id,
                roleId: role2.id,
                version: 0,
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: null,
            });

            const roles =
                await repository.findAllRolesByUserId(user.id);

            expect(roles).toHaveLength(2);

            expect(roles.map(role => role.id))
                .toEqual(
                    expect.arrayContaining([
                        role1.id,
                        role2.id,
                    ]),
                );

            expect(roles.map(role => role.name))
                .toEqual(
                    expect.arrayContaining([
                        role1.name,
                        role2.name,
                    ]),
                );
        });

        it("should return an empty array when user has no roles", async () => {

            const user = await helper.userRepository.create(
                await helper.createFakeUser(),
            );

            const roles =
                await repository.findAllRolesByUserId(user.id);

            expect(roles).toEqual([]);
        });

    });

    describe("update", () => {

        it("should update the relationship and increment version", async () => {

            const user1 = await helper.userRepository.create(
                await helper.createFakeUser(),
            );

            const user2 = await helper.userRepository.create(
                await helper.createFakeUser(),
            );

            const role = await helper.roleRepository.create(
                await helper.createFakeRole(),
            );

            const created = await repository.create({
                id: helper.generateUuid(),
                userId: user1.id,
                roleId: role.id,
                version: 0,
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: null,
            });

            const updated = await repository.update({
                ...created,
                userId: user2.id,
            });

            expect(updated).toBeDefined();
            expect(updated.id).toBe(created.id);
            expect(updated.userId).toBe(user2.id);
            expect(updated.roleId).toBe(role.id);
            expect(updated.version).toBe(created.version + 1);

            expect(
                new Date(updated.updatedAt).getTime(),
            ).toBeGreaterThanOrEqual(
                new Date(created.updatedAt).getTime(),
            );
        });

    });

    describe("deleteById", () => {

        it("should return true when relationship exists", async () => {

            const user = await helper.userRepository.create(
                await helper.createFakeUser(),
            );

            const role = await helper.roleRepository.create(
                await helper.createFakeRole(),
            );

            const created = await repository.create({
                id: helper.generateUuid(),
                userId: user.id,
                roleId: role.id,
                version: 0,
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: null,
            });

            const deleted =
                await repository.deleteById(created.id);

            expect(deleted).toBe(true);

            const found =
                await repository.findById(created.id);

            expect(found).toBeNull();
        });

        it("should return false when relationship does not exist", async () => {

            const deleted =
                await repository.deleteById(
                    helper.generateUuid(),
                );

            expect(deleted).toBe(false);
        });

    });

    describe("findAll", () => {

        it("should return paginated user-role relationships", async () => {

            const user = await helper.userRepository.create(
                await helper.createFakeUser(),
            );

            const role1 = await helper.roleRepository.create(
                await helper.createFakeRole(),
            );

            const role2 = await helper.roleRepository.create(
                await helper.createFakeRole(),
            );

            await repository.create({
                id: helper.generateUuid(),
                userId: user.id,
                roleId: role1.id,
                version: 0,
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: null,
            });

            await repository.create({
                id: helper.generateUuid(),
                userId: user.id,
                roleId: role2.id,
                version: 0,
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: null,
            });

            const pageable: Pageable<UserRoleSort> = {
                page: 1,
                size: 10,
                sortBy: UserRoleSort.CREATED_AT,
                direction: SortDirection.DESC,
            };

            const page =
                await repository.findAll(
                    { userId: user.id },
                    pageable,
                );

            expect(page).toBeDefined();
            expect(page.content).toHaveLength(2);
            expect(page.totalElements).toBe(2);

            expect(
                page.content.every(
                    item => item.userId === user.id,
                ),
            ).toBe(true);
        });

        it("should filter by id", async () => {

            const user = await helper.userRepository.create(
                await helper.createFakeUser(),
            );

            const role = await helper.roleRepository.create(
                await helper.createFakeRole(),
            );

            const created = await repository.create({
                id: helper.generateUuid(),
                userId: user.id,
                roleId: role.id,
                version: 0,
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: null,
            });

            const pageable: Pageable<UserRoleSort> = {
                page: 1,
                size: 10,
                sortBy: UserRoleSort.CREATED_AT,
                direction: SortDirection.DESC,
            };

            const page =
                await repository.findAll(
                    { id: created.id },
                    pageable,
                );

            expect(page.totalElements).toBe(1);
            expect(page.content).toHaveLength(1);
            expect(page.content[0].id).toBe(created.id);
        });

        it("should filter by roleId", async () => {

            const user = await helper.userRepository.create(
                await helper.createFakeUser(),
            );

            const role1 = await helper.roleRepository.create(
                await helper.createFakeRole(),
            );

            const role2 = await helper.roleRepository.create(
                await helper.createFakeRole(),
            );

            await repository.create({
                id: helper.generateUuid(),
                userId: user.id,
                roleId: role1.id,
                version: 0,
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: null,
            });

            await repository.create({
                id: helper.generateUuid(),
                userId: user.id,
                roleId: role2.id,
                version: 0,
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: null,
            });

            const pageable: Pageable<UserRoleSort> = {
                page: 1,
                size: 10,
                sortBy: UserRoleSort.CREATED_AT,
                direction: SortDirection.ASC,
            };

            const page =
                await repository.findAll(
                    { roleId: role1.id },
                    pageable,
                );

            expect(page.totalElements).toBe(1);
            expect(page.content).toHaveLength(1);
            expect(page.content[0].roleId).toBe(role1.id);
        });

        it("should filter by version", async () => {

            const user = await helper.userRepository.create(
                await helper.createFakeUser(),
            );

            const role = await helper.roleRepository.create(
                await helper.createFakeRole(),
            );

            await repository.create({
                id: helper.generateUuid(),
                userId: user.id,
                roleId: role.id,
                version: 5,
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: null,
            });

            const pageable: Pageable<UserRoleSort> = {
                page: 1,
                size: 10,
                sortBy: UserRoleSort.VERSION,
                direction: SortDirection.ASC,
            };

            const page =
                await repository.findAll(
                    { version: 5 },
                    pageable,
                );

            expect(page.totalElements).toBe(1);
            expect(page.content).toHaveLength(1);
            expect(page.content[0].version).toBe(5);
        });

        it("should respect pagination", async () => {

            const user = await helper.userRepository.create(
                await helper.createFakeUser(),
            );

            const roles: Role[] = [];

            for (let i = 0; i < 5; i++) {

                const role = await helper.roleRepository.create(
                    await helper.createFakeRole(),
                );

                roles.push(role);

                await repository.create({
                    id: helper.generateUuid(),
                    userId: user.id,
                    roleId: role.id,
                    version: 0,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    deletedAt: null,
                });
            }

            const pageable: Pageable<UserRoleSort> = {
                page: 2,
                size: 2,
                sortBy: UserRoleSort.CREATED_AT,
                direction: SortDirection.ASC,
            };

            const page =
                await repository.findAll(
                    { userId: user.id },
                    pageable,
                );

            expect(page.content).toHaveLength(2);
            expect(page.page).toBe(2);
            expect(page.size).toBe(2);
            expect(page.totalElements).toBe(5);
        });

        it("should support ascending sorting", async () => {

            const user = await helper.userRepository.create(
                await helper.createFakeUser(),
            );

            const role1 = await helper.roleRepository.create(
                await helper.createFakeRole(),
            );

            const role2 = await helper.roleRepository.create(
                await helper.createFakeRole(),
            );

            const first = await repository.create({
                id: helper.generateUuid(),
                userId: user.id,
                roleId: role1.id,
                version: 0,
                createdAt: new Date("2025-01-01T00:00:00Z"),
                updatedAt: new Date("2025-01-01T00:00:00Z"),
                deletedAt: null,
            });

            const second = await repository.create({
                id: helper.generateUuid(),
                userId: user.id,
                roleId: role2.id,
                version: 0,
                createdAt: new Date("2025-01-02T00:00:00Z"),
                updatedAt: new Date("2025-01-02T00:00:00Z"),
                deletedAt: null,
            });

            const pageable: Pageable<UserRoleSort> = {
                page: 1,
                size: 10,
                sortBy: UserRoleSort.CREATED_AT,
                direction: SortDirection.ASC,
            };

            const page =
                await repository.findAll(
                    { userId: user.id },
                    pageable,
                );

            expect(page.content[0].id).toBe(first.id);
            expect(page.content[1].id).toBe(second.id);
        });

        it("should support descending sorting", async () => {

            const user = await helper.userRepository.create(
                await helper.createFakeUser(),
            );

            const role1 = await helper.roleRepository.create(
                await helper.createFakeRole(),
            );

            const role2 = await helper.roleRepository.create(
                await helper.createFakeRole(),
            );

            const first = await repository.create({
                id: helper.generateUuid(),
                userId: user.id,
                roleId: role1.id,
                version: 0,
                createdAt: new Date("2025-01-01T00:00:00Z"),
                updatedAt: new Date("2025-01-01T00:00:00Z"),
                deletedAt: null,
            });

            const second = await repository.create({
                id: helper.generateUuid(),
                userId: user.id,
                roleId: role2.id,
                version: 0,
                createdAt: new Date("2025-01-02T00:00:00Z"),
                updatedAt: new Date("2025-01-02T00:00:00Z"),
                deletedAt: null,
            });

            const pageable: Pageable<UserRoleSort> = {
                page: 1,
                size: 10,
                sortBy: UserRoleSort.CREATED_AT,
                direction: SortDirection.DESC,
            };

            const page =
                await repository.findAll(
                    { userId: user.id },
                    pageable,
                );

            expect(page.content[0].id).toBe(second.id);
            expect(page.content[1].id).toBe(first.id);
        });

        it("should return an empty page when there are no matches", async () => {

            const pageable: Pageable<UserRoleSort> = {
                page: 1,
                size: 10,
                sortBy: UserRoleSort.CREATED_AT,
                direction: SortDirection.DESC,
            };

            const page =
                await repository.findAll(
                    {
                        userId: helper.generateUuid(),
                    },
                    pageable,
                );

            expect(page.content).toEqual([]);
            expect(page.totalElements).toBe(0);
        });

    });

});