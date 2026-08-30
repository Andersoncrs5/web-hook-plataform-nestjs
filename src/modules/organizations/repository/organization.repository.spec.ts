import {
    INestApplication,
} from "@nestjs/common";

import { BaseIntegrationTest } from "../../../../test/helpers/base-test.helper";
import { BaseTestHelper } from "../../../../test/helpers/integration-test.helper";

import { OrganizationRepository } from "./organization.repository";
import { OrganizationEntity } from "../entities/organization.entity";

import {
    Pageable,
    SortDirection,
} from "src/common/page/page";

import { OrganizationFilter } from "../dto/page/organization-filter.dto";
import { OrganizationSort } from "../dto/page/organization-sort.dto";
import { OrganizationStatus } from "src/common/enums/organization/organization-status.enum";

describe("OrganizationRepository (Integration Test)", () => {

    let helperOrganization: BaseTestHelper;
    let app: INestApplication;
    let repository: OrganizationRepository;

    beforeAll(async () => {
        await BaseIntegrationTest.setupAll();

        app = BaseIntegrationTest.getApp();
        helperOrganization = new BaseTestHelper(app);

        repository = app.get<OrganizationRepository>(
            OrganizationRepository,
        );
    }, 180000);
    
    it("should be defined", () => {
        expect(helperOrganization).toBeDefined();
        expect(app).toBeDefined();
        expect(repository).toBeDefined();
    });

    // =========================================================
    // CREATE
    // =========================================================

    describe("create", () => {

        it("should create a new organization successfully", async () => {

            const user =
                await helperOrganization.createUser();

            const organization =
                await helperOrganization.createFakeOrganization({
                    userId: user.id,
                });

            const created =
                await repository.create(organization);

            expect(created).toBeDefined();

            expect(created.id)
                .toBe(organization.id);

            expect(created.name)
                .toBe(organization.name);

            expect(created.slug)
                .toBe(organization.slug);

            expect(created.status)
                .toBe(organization.status);

            expect(created.userId)
                .toBe(organization.userId);

            expect(created.metadata)
                .toEqual(organization.metadata);

            expect(created.version)
                .toBe(0);

            expect(created.createdAt)
                .toBeDefined();

            expect(created.updatedAt)
                .toBeDefined();

            await repository.deleteById(
                created.id,
            );
        });
    });

    // =========================================================
    // FIND BY ID
    // =========================================================

    describe("findById", () => {

        it("should return an organization when id exists", async () => {

            const user =
                await helperOrganization.createUser();

            const organization =
                await helperOrganization.createFakeOrganization({
                    userId: user.id,
                });

            await repository.create(
                organization,
            );

            const found =
                await repository.findById(
                    organization.id,
                );

            expect(found)
                .not
                .toBeNull();

            expect(found?.id)
                .toBe(organization.id);

            expect(found?.name)
                .toBe(organization.name);

            expect(found?.slug)
                .toBe(organization.slug);

            expect(found?.status)
                .toBe(organization.status);

            expect(found?.userId)
                .toBe(user.id);

            await repository.deleteById(
                organization.id,
            );
        });

        it("should return null when organization does not exist", async () => {

            const nonExistentId =
                helperOrganization.generateUuid();

            const found =
                await repository.findById(
                    nonExistentId,
                );

            expect(found)
                .toBeNull();
        });
    });

    // =========================================================
    // EXISTS BY NAME
    // =========================================================

    describe("existsByName", () => {

        it("should return true when organization exists", async () => {

            const user =
                await helperOrganization.createUser();

            const organization =
                await helperOrganization.createFakeOrganization({
                    userId: user.id,
                });

            await repository.create(
                organization,
            );

            const exists =
                await repository.existsByName(
                    organization.name,
                );

            expect(exists)
                .toBe(true);

            await repository.deleteById(
                organization.id,
            );
        });

        it("should be case-insensitive", async () => {

            const user =
                await helperOrganization.createUser();

            const organization =
                await helperOrganization.createFakeOrganization({
                    userId: user.id,
                    name: `Acme_${helperOrganization.getRandomString(10)}`,
                });

            await repository.create(
                organization,
            );

            const exists =
                await repository.existsByName(
                    organization.name.toUpperCase(),
                );

            expect(exists)
                .toBe(true);

            await repository.deleteById(
                organization.id,
            );
        });

        it("should return false when organization does not exist", async () => {

            const exists =
                await repository.existsByName(
                    `nonexistent_${helperOrganization.getRandomString(12)}`,
                );

            expect(exists)
                .toBe(false);
        });
    });

    // =========================================================
    // EXISTS BY SLUG
    // =========================================================

    describe("existsBySlug", () => {

        it("should return true when organization exists", async () => {

            const user =
                await helperOrganization.createUser();

            const organization =
                await helperOrganization.createFakeOrganization({
                    userId: user.id,
                });

            await repository.create(
                organization,
            );

            const exists =
                await repository.existsBySlug(
                    organization.slug,
                );

            expect(exists)
                .toBe(true);

            await repository.deleteById(
                organization.id,
            );
        });

        it("should be case-insensitive", async () => {

            const user =
                await helperOrganization.createUser();

            const organization =
                await helperOrganization.createFakeOrganization({
                    userId: user.id,
                    slug: `company-${helperOrganization.getRandomString(10)}`,
                });

            await repository.create(
                organization,
            );

            const exists =
                await repository.existsBySlug(
                    organization.slug.toUpperCase(),
                );

            expect(exists)
                .toBe(true);

            await repository.deleteById(
                organization.id,
            );
        });

        it("should return false when organization does not exist", async () => {

            const exists =
                await repository.existsBySlug(
                    `nonexistent-${helperOrganization.getRandomString(12)}`,
                );

            expect(exists)
                .toBe(false);
        });
    });

    // =========================================================
    // FIND ALL
    // =========================================================

    describe("findAll", () => {

        it("should return all organizations when filter is empty", async () => {

            const user =
                await helperOrganization.createUser();

            const organization1 =
                await helperOrganization.createFakeOrganization({
                    userId: user.id,
                });

            const organization2 =
                await helperOrganization.createFakeOrganization({
                    userId: user.id,
                });

            await repository.create(
                organization1,
            );

            await repository.create(
                organization2,
            );

            const pageable: Pageable<OrganizationSort> = {
                page: 1,
                size: 10,
                sortBy: OrganizationSort.CREATED_AT,
                direction: SortDirection.ASC,
            };

            const page =
                await repository.findAll(
                    {} as OrganizationFilter,
                    pageable,
                );

            expect(page)
                .toBeDefined();

            expect(page.content.length)
                .toBe(2);

            expect(page.totalElements)
                .toBe(2);

            const ids =
                page.content
                    .map(item => item.id)
                    .sort();

            expect(ids).toEqual(
                [
                    organization1.id,
                    organization2.id,
                ].sort(),
            );

            await repository.deleteById(
                organization1.id,
            );

            await repository.deleteById(
                organization2.id,
            );
        });

        it("should filter by id", async () => {

            const user =
                await helperOrganization.createUser();

            const organization1 =
                await helperOrganization.createFakeOrganization({
                    userId: user.id,
                });

            const organization2 =
                await helperOrganization.createFakeOrganization({
                    userId: user.id,
                });

            await repository.create(
                organization1,
            );

            await repository.create(
                organization2,
            );

            const page =
                await repository.findAll(
                    {
                        id: organization1.id,
                    } as OrganizationFilter,
                    {
                        page: 1,
                        size: 10,
                        sortBy: OrganizationSort.CREATED_AT,
                        direction: SortDirection.ASC,
                    },
                );

            expect(page.totalElements)
                .toBe(1);

            expect(page.content.length)
                .toBe(1);

            expect(page.content[0].id)
                .toBe(organization1.id);

            await repository.deleteById(
                organization1.id,
            );

            await repository.deleteById(
                organization2.id,
            );
        });

        it("should filter by name ignoring case", async () => {

            const user =
                await helperOrganization.createUser();

            const target =
                await helperOrganization.createFakeOrganization({
                    userId: user.id,
                    name: `Acme Corporation ${helperOrganization.getRandomString(8)}`,
                });

            const other =
                await helperOrganization.createFakeOrganization({
                    userId: user.id,
                    name: `Other Corporation ${helperOrganization.getRandomString(8)}`,
                });

            await repository.create(target);
            await repository.create(other);

            const page =
                await repository.findAll(
                    {
                        name: "ACME CORPORATION",
                    } as OrganizationFilter,
                    {
                        page: 1,
                        size: 10,
                        sortBy: OrganizationSort.NAME,
                        direction: SortDirection.ASC,
                    },
                );

            expect(page.totalElements)
                .toBe(1);

            expect(page.content.length)
                .toBe(1);

            expect(page.content[0].id)
                .toBe(target.id);

            await repository.deleteById(
                target.id,
            );

            await repository.deleteById(
                other.id,
            );
        });

        it("should filter by slug ignoring case", async () => {

            const user =
                await helperOrganization.createUser();

            const target =
                await helperOrganization.createFakeOrganization({
                    userId: user.id,
                    slug: `my-company-${helperOrganization.getRandomString(8)}`,
                });

            const other =
                await helperOrganization.createFakeOrganization({
                    userId: user.id,
                    slug: `other-company-${helperOrganization.getRandomString(8)}`,
                });

            await repository.create(target);
            await repository.create(other);

            const page =
                await repository.findAll(
                    {
                        slug: target.slug.toUpperCase(),
                    } as OrganizationFilter,
                    {
                        page: 1,
                        size: 10,
                        sortBy: OrganizationSort.SLUG,
                        direction: SortDirection.ASC,
                    },
                );

            expect(page.totalElements)
                .toBe(1);

            expect(page.content.length)
                .toBe(1);

            expect(page.content[0].id)
                .toBe(target.id);

            await repository.deleteById(
                target.id,
            );

            await repository.deleteById(
                other.id,
            );
        });

        it("should filter by status", async () => {

            const user =
                await helperOrganization.createUser();

            const active =
                await helperOrganization.createFakeOrganization({
                    userId: user.id,
                    status: OrganizationStatus.ACTIVE,
                });

            const inactive =
                await helperOrganization.createFakeOrganization({
                    userId: user.id,
                    status: OrganizationStatus.INACTIVE,
                });

            const suspended =
                await helperOrganization.createFakeOrganization({
                    userId: user.id,
                    status: OrganizationStatus.SUSPENDED,
                });

            await repository.create(active);
            await repository.create(inactive);
            await repository.create(suspended);

            const page =
                await repository.findAll(
                    {
                        status: [
                            OrganizationStatus.INACTIVE,
                            OrganizationStatus.SUSPENDED,
                        ],
                    } as OrganizationFilter,
                    {
                        page: 1,
                        size: 10,
                        sortBy: OrganizationSort.STATUS,
                        direction: SortDirection.ASC,
                    },
                );

            expect(page.totalElements)
                .toBe(2);

            expect(page.content.length)
                .toBe(2);

            const ids =
                page.content
                    .map(item => item.id)
                    .sort();

            expect(ids).toEqual(
                [
                    inactive.id,
                    suspended.id,
                ].sort(),
            );

            await repository.deleteById(active.id);
            await repository.deleteById(inactive.id);
            await repository.deleteById(suspended.id);
        });

        it("should filter by userId", async () => {

            const user1 =
                await helperOrganization.createUser();

            const user2 =
                await helperOrganization.createUser();

            const organization1 =
                await helperOrganization.createFakeOrganization({
                    userId: user1.id,
                });

            const organization2 =
                await helperOrganization.createFakeOrganization({
                    userId: user2.id,
                });

            await repository.create(organization1);
            await repository.create(organization2);

            const page =
                await repository.findAll(
                    {
                        userId: user1.id,
                    } as OrganizationFilter,
                    {
                        page: 1,
                        size: 10,
                        sortBy: OrganizationSort.CREATED_AT,
                        direction: SortDirection.ASC,
                    },
                );

            expect(page.totalElements)
                .toBe(1);

            expect(page.content.length)
                .toBe(1);

            expect(page.content[0].id)
                .toBe(organization1.id);

            expect(page.content[0].userId)
                .toBe(user1.id);

            await repository.deleteById(
                organization1.id,
            );

            await repository.deleteById(
                organization2.id,
            );
        });

        it("should filter by version", async () => {

            const user =
                await helperOrganization.createUser();

            const organization =
                await helperOrganization.createFakeOrganization({
                    userId: user.id,
                });

            const created =
                await repository.create(
                    organization,
                );

            const updated: OrganizationEntity = {
                ...created,
                name:
                    `${created.name}_updated`,
                slug:
                    `${created.slug}-updated`,
            };

            const result =
                await repository.update(
                    updated,
                );

            expect(result.version)
                .toBe(1);

            const page =
                await repository.findAll(
                    {
                        version: 1,
                    } as OrganizationFilter,
                    {
                        page: 1,
                        size: 10,
                        sortBy: OrganizationSort.VERSION,
                        direction: SortDirection.ASC,
                    },
                );

            expect(page.totalElements)
                .toBe(1);

            expect(page.content[0].id)
                .toBe(created.id);

            expect(page.content[0].version)
                .toBe(1);

            await repository.deleteById(
                created.id,
            );
        });

        it("should filter by createdAt range", async () => {

            const user =
                await helperOrganization.createUser();

            const before =
                new Date(
                    "2026-01-01T00:00:00.000Z",
                );

            const targetCreatedAt =
                new Date(
                    "2026-06-01T00:00:00.000Z",
                );

            const after =
                new Date(
                    "2026-12-31T23:59:59.999Z",
                );

            const organization =
                await helperOrganization.createFakeOrganization({
                    userId: user.id,
                    createdAt: targetCreatedAt,
                    updatedAt: targetCreatedAt,
                });

            await repository.create(
                organization,
            );

            const page =
                await repository.findAll(
                    {
                        createdAtMin: before,
                        createdAtMax: after,
                    } as OrganizationFilter,
                    {
                        page: 1,
                        size: 10,
                        sortBy: OrganizationSort.CREATED_AT,
                        direction: SortDirection.ASC,
                    },
                );

            expect(page.totalElements)
                .toBe(1);

            expect(page.content[0].id)
                .toBe(organization.id);

            await repository.deleteById(
                organization.id,
            );
        });

        it("should filter by updatedAt range", async () => {

            const user =
                await helperOrganization.createUser();

            const targetUpdatedAt =
                new Date(
                    "2026-06-15T12:00:00.000Z",
                );

            const organization =
                await helperOrganization.createFakeOrganization({
                    userId: user.id,
                    updatedAt: targetUpdatedAt,
                });

            await repository.create(
                organization,
            );

            const page =
                await repository.findAll(
                    {
                        updatedAtMin: new Date(
                            "2026-06-01T00:00:00.000Z",
                        ),
                        updatedAtMax: new Date(
                            "2026-06-30T23:59:59.999Z",
                        ),
                    } as OrganizationFilter,
                    {
                        page: 1,
                        size: 10,
                        sortBy: OrganizationSort.UPDATED_AT,
                        direction: SortDirection.ASC,
                    },
                );

            expect(page.totalElements)
                .toBe(1);

            expect(page.content[0].id)
                .toBe(organization.id);

            await repository.deleteById(
                organization.id,
            );
        });

        it("should paginate results", async () => {

            const user =
                await helperOrganization.createUser();

            const organization1 =
                await helperOrganization.createFakeOrganization({
                    userId: user.id,
                });

            const organization2 =
                await helperOrganization.createFakeOrganization({
                    userId: user.id,
                });

            const organization3 =
                await helperOrganization.createFakeOrganization({
                    userId: user.id,
                });

            await repository.create(organization1);
            await repository.create(organization2);
            await repository.create(organization3);

            const page =
                await repository.findAll(
                    {} as OrganizationFilter,
                    {
                        page: 1,
                        size: 2,
                        sortBy: OrganizationSort.CREATED_AT,
                        direction: SortDirection.ASC,
                    },
                );

            expect(page.content.length)
                .toBe(2);

            expect(page.totalElements)
                .toBe(3);

            expect(page.page)
                .toBe(1);

            expect(page.size)
                .toBe(2);

            await repository.deleteById(
                organization1.id,
            );

            await repository.deleteById(
                organization2.id,
            );

            await repository.deleteById(
                organization3.id,
            );
        });

        it("should return empty page when there are no matches", async () => {

            const page =
                await repository.findAll(
                    {
                        name: `does-not-exist-${helperOrganization.getRandomString(12)}`,
                    } as OrganizationFilter,
                    {
                        page: 1,
                        size: 10,
                        sortBy: OrganizationSort.NAME,
                        direction: SortDirection.ASC,
                    },
                );

            expect(page)
                .toBeDefined();

            expect(page.content)
                .toEqual([]);

            expect(page.totalElements)
                .toBe(0);
        });

        it("should sort by name ascending", async () => {

            const user =
                await helperOrganization.createUser();

            const organizationA =
                await helperOrganization.createFakeOrganization({
                    userId: user.id,
                    name: `AAA_${helperOrganization.getRandomString(8)}`,
                });

            const organizationB =
                await helperOrganization.createFakeOrganization({
                    userId: user.id,
                    name: `ZZZ_${helperOrganization.getRandomString(8)}`,
                });

            await repository.create(
                organizationB,
            );

            await repository.create(
                organizationA,
            );

            const page =
                await repository.findAll(
                    {} as OrganizationFilter,
                    {
                        page: 1,
                        size: 10,
                        sortBy: OrganizationSort.NAME,
                        direction: SortDirection.ASC,
                    },
                );

            const indexA =
                page.content.findIndex(
                    item => item.id === organizationA.id,
                );

            const indexB =
                page.content.findIndex(
                    item => item.id === organizationB.id,
                );

            expect(indexA)
                .toBeLessThan(indexB);

            await repository.deleteById(
                organizationA.id,
            );

            await repository.deleteById(
                organizationB.id,
            );
        });

        it("should sort by name descending", async () => {

            const user =
                await helperOrganization.createUser();

            const organizationA =
                await helperOrganization.createFakeOrganization({
                    userId: user.id,
                    name: `AAA_${helperOrganization.getRandomString(8)}`,
                });

            const organizationB =
                await helperOrganization.createFakeOrganization({
                    userId: user.id,
                    name: `ZZZ_${helperOrganization.getRandomString(8)}`,
                });

            await repository.create(
                organizationA,
            );

            await repository.create(
                organizationB,
            );

            const page =
                await repository.findAll(
                    {} as OrganizationFilter,
                    {
                        page: 1,
                        size: 10,
                        sortBy: OrganizationSort.NAME,
                        direction: SortDirection.DESC,
                    },
                );

            const indexA =
                page.content.findIndex(
                    item => item.id === organizationA.id,
                );

            const indexB =
                page.content.findIndex(
                    item => item.id === organizationB.id,
                );

            expect(indexB)
                .toBeLessThan(indexA);

            await repository.deleteById(
                organizationA.id,
            );

            await repository.deleteById(
                organizationB.id,
            );
        });

        it("should support ascending and descending sorting by createdAt", async () => {

            const user =
                await helperOrganization.createUser();

            const older =
                await helperOrganization.createFakeOrganization({
                    userId: user.id,
                    createdAt:
                        new Date(
                            "2026-01-01T00:00:00.000Z",
                        ),
                });

            const newer =
                await helperOrganization.createFakeOrganization({
                    userId: user.id,
                    createdAt:
                        new Date(
                            "2026-07-01T00:00:00.000Z",
                        ),
                });

            await repository.create(older);
            await repository.create(newer);

            const ascPage =
                await repository.findAll(
                    {} as OrganizationFilter,
                    {
                        page: 1,
                        size: 10,
                        sortBy: OrganizationSort.CREATED_AT,
                        direction: SortDirection.ASC,
                    },
                );

            const ascOlder =
                ascPage.content.findIndex(
                    item => item.id === older.id,
                );

            const ascNewer =
                ascPage.content.findIndex(
                    item => item.id === newer.id,
                );

            expect(ascOlder)
                .toBeLessThan(ascNewer);

            const descPage =
                await repository.findAll(
                    {} as OrganizationFilter,
                    {
                        page: 1,
                        size: 10,
                        sortBy: OrganizationSort.CREATED_AT,
                        direction: SortDirection.DESC,
                    },
                );

            const descOlder =
                descPage.content.findIndex(
                    item => item.id === older.id,
                );

            const descNewer =
                descPage.content.findIndex(
                    item => item.id === newer.id,
                );

            expect(descNewer)
                .toBeLessThan(descOlder);

            await repository.deleteById(
                older.id,
            );

            await repository.deleteById(
                newer.id,
            );
        });
    });

    // =========================================================
    // UPDATE
    // =========================================================

    describe("update", () => {

        it("should update organization and increment version", async () => {

            const user =
                await helperOrganization.createUser();

            const organization =
                await helperOrganization.createFakeOrganization({
                    userId: user.id,
                });

            const created =
                await repository.create(
                    organization,
                );

            const beforeUpdatedAt =
                created.updatedAt;

            const updatedOrganization:
                OrganizationEntity = {
                    ...created,
                    name:
                        `Updated Organization ${helperOrganization.getRandomString(8)}`,
                    slug:
                        `updated-${helperOrganization.getRandomString(8)}`,
                    status:
                        OrganizationStatus.INACTIVE,
                };

            const updated =
                await repository.update(
                    updatedOrganization,
                );

            expect(updated)
                .toBeDefined();

            expect(updated.id)
                .toBe(created.id);

            expect(updated.name)
                .toBe(updatedOrganization.name);

            expect(updated.slug)
                .toBe(updatedOrganization.slug);

            expect(updated.status)
                .toBe(OrganizationStatus.INACTIVE);

            expect(updated.userId)
                .toBe(created.userId);

            expect(updated.version)
                .toBe(created.version + 1);

            expect(
                new Date(
                    updated.updatedAt,
                ).getTime(),
            ).toBeGreaterThanOrEqual(
                new Date(
                    beforeUpdatedAt,
                ).getTime(),
            );

            await repository.deleteById(
                created.id,
            );
        });
    });

    // =========================================================
    // DELETE
    // =========================================================

    describe("deleteById", () => {

        it("should delete organization and return true", async () => {

            const user =
                await helperOrganization.createUser();

            const organization =
                await helperOrganization.createFakeOrganization({
                    userId: user.id,
                });

            await repository.create(
                organization,
            );

            const deleted =
                await repository.deleteById(
                    organization.id,
                );

            expect(deleted)
                .toBe(true);

            const found =
                await repository.findById(
                    organization.id,
                );

            expect(found)
                .toBeNull();
        });

        it("should return false when organization does not exist", async () => {

            const nonExistentId =
                helperOrganization.generateUuid();

            const deleted =
                await repository.deleteById(
                    nonExistentId,
                );

            expect(deleted)
                .toBe(false);
        });
    });
});