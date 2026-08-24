import { INestApplication } from "@nestjs/common";
import { BaseIntegrationTest } from "../../../../test/helpers/base-test.helper";
import { BaseTestHelper } from "../../../../test/helpers/integration-test.helper";

import { RoleRepository } from "src/modules/roles/repository/roles.repository";
import { Role } from "src/modules/roles/entities/role.entity";
import { RoleFilter } from "src/modules/roles/dto/role-filter.dto";
import { RoleSort } from "src/modules/roles/dto/role-sort.dto";
import { Page, Pageable, SortDirection } from "src/common/page/page";

describe("RoleRepository (Integration Test)", () => {
    let helperRole: BaseTestHelper;
    let app: INestApplication;
    let repository: RoleRepository;

    const createdRoleIds: string[] = [];

    const trackRole = (role: Role): Role => {
        createdRoleIds.push(role.id);
        return role;
    };

    beforeAll(async () => {
        await BaseIntegrationTest.setupAll();

        app = BaseIntegrationTest.getApp();
        helperRole = new BaseTestHelper(app);

        repository = app.get<RoleRepository>(RoleRepository);
    }, 180000);

    afterEach(async () => {
        if (!repository) {
            createdRoleIds.length = 0;
            return;
        }

        const ids = [...createdRoleIds].reverse();
        createdRoleIds.length = 0;

        for (const id of ids) {
            try {
                await repository.deleteById(id);
            } catch {
             
            }
        }
    });

    afterAll(async () => {
        await BaseIntegrationTest.teardownAll();
    });

    it("should be defined", () => {
        expect(helperRole).toBeDefined();
        expect(app).toBeDefined();
        expect(repository).toBeDefined();
    });

    describe("create", () => {
        it("should create a new role successfully", async () => {
            const fakeRole = trackRole(await helperRole.createFakeRole());

            const createdRole = await repository.create(fakeRole);

            expect(createdRole).toBeDefined();
            expect(createdRole.id).toBe(fakeRole.id);
            expect(createdRole.name).toBe(fakeRole.name);
            expect(createdRole.description).toBe(fakeRole.description);
            expect(createdRole.isActive).toBe(fakeRole.isActive);
            expect(createdRole.version).toBe(0);
            expect(createdRole.createdAt).toBeDefined();
            expect(createdRole.updatedAt).toBeDefined();
        });
    });

    describe("findById", () => {
        it("should return a role when id exists", async () => {
            const fakeRole = trackRole(await helperRole.createFakeRole());
            await repository.create(fakeRole);

            const foundRole = await repository.findById(fakeRole.id);

            expect(foundRole).not.toBeNull();
            expect(foundRole?.id).toBe(fakeRole.id);
            expect(foundRole?.name).toBe(fakeRole.name);
            expect(foundRole?.description).toBe(fakeRole.description);
        });

        it("should return null when role id does not exist", async () => {
            const nonExistentId = helperRole.generateUuid();

            const foundRole = await repository.findById(nonExistentId);

            expect(foundRole).toBeNull();
        });
    });

    describe("findByIds", () => {
        it("should return roles when ids exist", async () => {
            const role1 = trackRole(await helperRole.createFakeRole());
            const role2 = trackRole(await helperRole.createFakeRole());
            const role3 = trackRole(await helperRole.createFakeRole());

            await repository.create(role1);
            await repository.create(role2);
            await repository.create(role3);

            const foundRoles = await repository.findByIds(
                [role1.id, role2.id, role3.id],
            );

            expect(foundRoles).toBeDefined();
            expect(foundRoles.length).toBe(3);

            const foundIds = foundRoles.map((role) => role.id).sort();
            expect(foundIds).toEqual([role1.id, role2.id, role3.id].sort());
        });

        it("should respect the provided limit", async () => {
            const role1 = trackRole(await helperRole.createFakeRole());
            const role2 = trackRole(await helperRole.createFakeRole());
            const role3 = trackRole(await helperRole.createFakeRole());

            await repository.create(role1);
            await repository.create(role2);
            await repository.create(role3);

            const foundRoles = await repository.findByIds(
                [role1.id, role2.id, role3.id],
                2,
            );

            expect(foundRoles).toBeDefined();
            expect(foundRoles.length).toBe(2);

            const foundIds = foundRoles.map((role) => role.id);
            expect(foundIds.every((id) => [role1.id, role2.id, role3.id].includes(id))).toBe(true);
        });

        it("should return an empty array when ids is empty", async () => {
            const foundRoles = await repository.findByIds([]);

            expect(foundRoles).toEqual([]);
        });

        it("should return an empty array when ids is undefined or null-like", async () => {
            const foundRoles = await repository.findByIds(undefined as unknown as string[]);

            expect(foundRoles).toEqual([]);
        });
    });

    describe("findAll", () => {

        it("should return all roles when filter is empty", async () => {
            const role1 = trackRole(await helperRole.createFakeRole());
            const role2 = trackRole(await helperRole.createFakeRole());

            await repository.create(role1);
            await repository.create(role2);

            const pageable: Pageable<RoleSort> = {
                page: 1,
                size: 10,
                sortBy: "createdAt" as RoleSort,
                direction: SortDirection.DESC,
            };

            const page = await repository.findAll({} as RoleFilter, pageable);

            expect(page).toBeDefined();
            expect(page.totalElements).toBe(2);
            expect(page.content.length).toBe(2);

            const ids = page.content.map((role) => role.id).sort();
            expect(ids).toEqual([role1.id, role2.id].sort());
        });

        it("should support description and isActive filters", async () => {
            const targetDescription = "special-description-" + helperRole.getRandomString(5);

            const activeRole = trackRole(
                await helperRole.createFakeRole({
                    name: "TargetRole_" + helperRole.getRandomString(5),
                    description: targetDescription,
                    isActive: true,
                }),
            );

            const inactiveRole = trackRole(
                await helperRole.createFakeRole({
                    name: "TargetRole_" + helperRole.getRandomString(5),
                    description: targetDescription,
                    isActive: false,
                }),
            );

            await repository.create(activeRole);
            await repository.create(inactiveRole);

            const pageable: Pageable<RoleSort> = {
                page: 1,
                size: 10,
                sortBy: "createdAt" as RoleSort,
                direction: SortDirection.DESC,
            };

            const filter: RoleFilter = {
                description: targetDescription,
                isActive: true,
            } as RoleFilter;

            const page = await repository.findAll(filter, pageable);

            expect(page.totalElements).toBe(1);
            expect(page.content.length).toBe(1);
            expect(page.content[0].id).toBe(activeRole.id);
            expect(page.content[0].description).toBe(targetDescription);
            expect(page.content[0].isActive).toBe(true);
        });
    });

    describe("update", () => {
        it("should update role data and increment version", async () => {
            const fakeRole = trackRole(await helperRole.createFakeRole());
            const createdRole = await repository.create(fakeRole);

            const beforeUpdate = new Date();

            const updatedFields: Role = {
                ...createdRole,
                name: "Updated Role " + helperRole.getRandomString(6),
                description: "Updated Description " + helperRole.getRandomString(6),
                isActive: false,
            };

            const updatedRole = await repository.update(updatedFields);

            expect(updatedRole).toBeDefined();
            expect(updatedRole.id).toBe(createdRole.id);
            expect(updatedRole.name).toBe(updatedFields.name);
            expect(updatedRole.description).toBe(updatedFields.description);
            expect(updatedRole.isActive).toBe(false);
            expect(updatedRole.version).toBe(createdRole.version + 1);
            expect(new Date(updatedRole.updatedAt).getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime());
        });
    });

    describe("deleteById", () => {
        it("should delete role and return true", async () => {
            const fakeRole = trackRole(await helperRole.createFakeRole());
            await repository.create(fakeRole);

            const deleted = await repository.deleteById(fakeRole.id);
            const foundRole = await repository.findById(fakeRole.id);

            expect(deleted).toBe(true);
            expect(foundRole).toBeNull();
        });

        it("should return false if role to delete does not exist", async () => {
            const nonExistentId = helperRole.generateUuid();

            const deleted = await repository.deleteById(nonExistentId);

            expect(deleted).toBe(false);
        });
    });

    describe("existsByName", () => {
        it("should return true if role exists", async () => {
            const fakeRole = trackRole(await helperRole.createFakeRole());
            await repository.create(fakeRole);

            const exists = await repository.existsByName(fakeRole.name);

            expect(exists).toBe(true);
        });

        it("should return false if role does not exist", async () => {
            const nonExistentName = `nonexistent_${helperRole.getRandomString(12)}`;

            const exists = await repository.existsByName(nonExistentName);

            expect(exists).toBe(false);
        });
    });
});
