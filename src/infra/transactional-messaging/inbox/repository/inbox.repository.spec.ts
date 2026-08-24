import { INestApplication } from "@nestjs/common";

import { BaseIntegrationTest } from "../../../../../test/helpers/base-test.helper";
import { BaseTestHelper } from "../../../../../test/helpers/integration-test.helper";


import {
    Pageable,
    SortDirection,
} from "src/common/page/page";
import { InboxRepository } from "./inbox.repository";
import { InboxEntity } from "../entities/inbox.entity";
import { InboxStatus } from "src/utils/enums/inbox-status.enum";
import { InboxSort } from "../dto/inbox-page.dto";
import { InboxFilter } from "../dto/inbox-filter.dto";

describe("InboxRepository (Integration Test)", () => {

    let app: INestApplication;
    let helper: BaseTestHelper;
    let repository: InboxRepository;

    beforeAll(async () => {

        await BaseIntegrationTest.setupAll();

        app = BaseIntegrationTest.getApp();

        helper = new BaseTestHelper(app);

        repository = app.get<InboxRepository>(
            InboxRepository,
        );

    }, 180000);

    afterAll(async () => {

        await BaseIntegrationTest.teardownAll();

    });

    beforeEach(async () => {
        await repository.deleteAll(); 
    })

    it("should be defined", () => {

        expect(app).toBeDefined();

        expect(helper).toBeDefined();

        expect(repository).toBeDefined();

    });

    describe("create", () => {

        it("should create an inbox successfully", async () => {

            const inbox = await helper.createFakeInbox();

            const created = await repository.create(inbox);

            expect(created).toBeDefined();

            expect(created.id).toBe(
                inbox.id,
            );

            expect(created.source).toBe(
                inbox.source,
            );

            expect(created.messageId).toBe(
                inbox.messageId,
            );

            expect(created.status).toBe(
                inbox.status,
            );

            expect(created.version).toBe(0);

        });

    });

    describe("findById", () => {

        it("should return inbox when id exists", async () => {

            const created =
                await helper.createInbox();

            const found =
                await repository.findById(
                    created.id,
                );

            expect(found).not.toBeNull();

            expect(found?.id).toBe(
                created.id,
            );

            expect(found?.source).toBe(
                created.source,
            );

            expect(found?.messageId).toBe(
                created.messageId,
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

    describe("findByMessageIdAndSource", () => {

        it("should return inbox when messageId and source exist", async () => {

            const created =
                await helper.createInbox();

            const found =
                await repository.findByMessageIdAndSource(
                    created.messageId,
                    created.source,
                );

            expect(found).not.toBeNull();

            expect(found?.id).toBe(
                created.id,
            );

            expect(found?.messageId).toBe(
                created.messageId,
            );

            expect(found?.source).toBe(
                created.source,
            );

        });

        it("should return null when messageId does not exist", async () => {

            const created =
                await helper.createInbox();

            const found =
                await repository.findByMessageIdAndSource(
                    helper.generateUuid(),
                    created.source,
                );

            expect(found).toBeNull();

        });

        it("should return null when source does not match", async () => {

            const created =
                await helper.createInbox();

            const found =
                await repository.findByMessageIdAndSource(
                    created.messageId,
                    "another-source",
                );

            expect(found).toBeNull();

        });

    });

    describe("existsByMessageIdAndSource", () => {

        it("should return true when messageId and source exist", async () => {

            const created =
                await helper.createInbox();

            const exists =
                await repository.existsByMessageIdAndSource(
                    created.messageId,
                    created.source,
                );

            expect(exists).toBe(true);

        });

        it("should return false when messageId does not exist", async () => {

            const created =
                await helper.createInbox();

            const exists =
                await repository.existsByMessageIdAndSource(
                    helper.generateUuid(),
                    created.source,
                );

            expect(exists).toBe(false);

        });

        it("should return false when source does not match", async () => {

            const created =
                await helper.createInbox();

            const exists =
                await repository.existsByMessageIdAndSource(
                    created.messageId,
                    "invalid-source",
                );

            expect(exists).toBe(false);

        });

    });

    describe("update", () => {

        it("should update inbox and increment version", async () => {

            const created = await helper.createInbox();

            const key = helper.getRandomString(16);

            const payload = JSON.stringify({
                event: "user.created",
                data: {
                    id: helper.generateUuid(),
                    name: `User_${key}`,
                },
            })

            const updatedFields: InboxEntity = {

                ...created,

                status: InboxStatus.PROCESSED,

                processedAt: new Date(),

                payload: payload,

            };

            const updated =
                await repository.update(
                    updatedFields,
                );

            expect(updated).toBeDefined();

            expect(updated.id).toBe(
                created.id,
            );

            expect(updated.status).toBe(
                "PROCESSED",
            );

            expect(updated.processedAt).not.toBeNull();

            expect(updated.version).toBe(
                created.version + 1,
            );

            expect(
                new Date(
                    updated.updatedAt,
                ).getTime(),
            ).toBeGreaterThanOrEqual(
                new Date(
                    created.updatedAt,
                ).getTime(),
            );

        });

    });

    describe("deleteById", () => {

        it("should return true when inbox exists", async () => {

            const created =
                await helper.createInbox();

            const deleted =
                await repository.deleteById(
                    created.id,
                );

            expect(deleted).toBe(true);

            const found =
                await repository.findById(
                    created.id,
                );

            expect(found).toBeNull();

        });

        it("should return false when inbox does not exist", async () => {

            const deleted =
                await repository.deleteById(
                    helper.generateUuid(),
                );

            expect(deleted).toBe(false);

        });

    });

    describe("deleteByIds", () => {

        it("should delete multiple inbox records", async () => {

            const inbox1 =
                await helper.createInbox();

            const inbox2 =
                await helper.createInbox();

            const inbox3 =
                await helper.createInbox();

            const deleted =
                await repository.deleteByIds([
                    inbox1.id,
                    inbox2.id,
                    inbox3.id,
                ]);

            expect(deleted).toBe(3);

            expect(
                await repository.findById(
                    inbox1.id,
                ),
            ).toBeNull();

            expect(
                await repository.findById(
                    inbox2.id,
                ),
            ).toBeNull();

            expect(
                await repository.findById(
                    inbox3.id,
                ),
            ).toBeNull();

        });

        it("should delete only existing ids", async () => {

            const created =
                await helper.createInbox();

            const nonExistentId =
                helper.generateUuid();

            const deleted =
                await repository.deleteByIds([
                    created.id,
                    nonExistentId,
                ]);

            expect(deleted).toBe(1);

            expect(
                await repository.findById(
                    created.id,
                ),
            ).toBeNull();

        });

        it("should return zero when no ids exist", async () => {

            const deleted =
                await repository.deleteByIds([
                    helper.generateUuid(),
                    helper.generateUuid(),
                ]);

            expect(deleted).toBe(0);

        });

    });

    describe("deleteAll", () => { 
        it("should delete all inbox records and return the number of deleted records", async () => { 
            await repository.deleteAll(); 

            const inbox1 = await helper.createInbox(); 
            const inbox2 = await helper.createInbox(); 
            const inbox3 = await helper.createInbox(); 
            
            const deletedCount = await repository.deleteAll(); 
            expect(deletedCount).toBe(3); 
            const found1 = await repository.findById(inbox1.id); 
            const found2 = await repository.findById(inbox2.id); 
            const found3 = await repository.findById(inbox3.id); 
            expect(found1).toBeNull(); 
            expect(found2).toBeNull(); 
            expect(found3).toBeNull(); 
        }); 
            
        it("should return zero when there are no inbox records", async () => { 
            const deletedCount = await repository.deleteAll(); 
            expect(deletedCount).toBe(0);
        }); 
        
        it("should delete only existing records when called multiple times", async () => { 
            const inbox1 = await helper.createInbox(); 
            const inbox2 = await helper.createInbox(); 
            
            const firstDeletedCount = await repository.deleteAll(); 
            
            expect(firstDeletedCount).toBe(2); 
            const secondDeletedCount = await repository.deleteAll(); 
            expect(secondDeletedCount).toBe(0); 
        }); 
    });

    describe("findAll", () => {

        it("should return all inbox records with pagination", async () => {
            await helper.getInboxRepository();

            const key =
                helper.getRandomString(8);

            const inbox1 =
                await helper.createInbox({
                    source: `source_${key}_1`,
                });

            const inbox2 =
                await helper.createInbox({
                    source: `source_${key}_2`,
                });

            const pageable: Pageable<InboxSort> = {

                page: 1,

                size: 10,

                sortBy: InboxSort.CREATED_AT,

                direction: SortDirection.ASC,

            };

            const page =
                await repository.findAll(
                    {} as InboxFilter,
                    pageable,
                );

            expect(page).toBeDefined();

            expect(page.content.length)
                .toBeGreaterThanOrEqual(2);

            expect(page.totalElements)
                .toBeGreaterThanOrEqual(2);

            expect(
                page.content.some(
                    item => item.id === inbox1.id,
                ),
            ).toBe(true);

            expect(
                page.content.some(
                    item => item.id === inbox2.id,
                ),
            ).toBe(true);

        });

        it("should filter by id", async () => {

            const created =
                await helper.createInbox();

            const pageable: Pageable<InboxSort> = {

                page: 1,

                size: 10,

                sortBy: InboxSort.CREATED_AT,

                direction: SortDirection.DESC,

            };

            const page =
                await repository.findAll(
                    {
                        id: created.id,
                    } as InboxFilter,
                    pageable,
                );

            expect(page.totalElements).toBe(1);

            expect(page.content).toHaveLength(1);

            expect(page.content[0].id).toBe(
                created.id,
            );

        });

        it("should filter by source using partial match", async () => {

            const key =
                helper.getRandomString(8);

            const matching =
                await helper.createInbox({
                    source: `webhook_${key}_github`,
                });

            await helper.createInbox({
                source: `payment_${key}`,
            });

            const pageable: Pageable<InboxSort> = {

                page: 1,

                size: 10,

                sortBy: InboxSort.SOURCE,

                direction: SortDirection.ASC,

            };

            const page =
                await repository.findAll(
                    {
                        source: `webhook_${key}`,
                    } as InboxFilter,
                    pageable,
                );

            expect(page.totalElements).toBe(1);

            expect(page.content).toHaveLength(1);

            expect(page.content[0].id).toBe(
                matching.id,
            );

        });

        it("should filter by messageId", async () => {

            const created =
                await helper.createInbox();

            const pageable: Pageable<InboxSort> = {

                page: 1,

                size: 10,

                sortBy: InboxSort.CREATED_AT,

                direction: SortDirection.DESC,

            };

            const page =
                await repository.findAll(
                    {
                        messageId: created.messageId,
                    } as InboxFilter,
                    pageable,
                );

            expect(page.totalElements).toBe(1);

            expect(page.content[0].id).toBe(
                created.id,
            );

        });

        it("should filter by payload using partial match", async () => {
            await repository.deleteAll(); 

            const key =
                helper.getRandomString(8);

            const matching =
                await helper.createInbox({
                    payload: JSON.stringify({
                        event: `order.created.${key}`,
                        customer: "john",
                    }),
                });

            const pageable: Pageable<InboxSort> = {

                page: 1,

                size: 10,

                sortBy: InboxSort.CREATED_AT,

                direction: SortDirection.DESC,

            };

            const page =
                await repository.findAll(
                    {
                        payload: key,
                    } as InboxFilter,
                    pageable,
                );

            expect(page.content.some(
                item => item.id === matching.id,
            )).toBe(true);

        });

        it("should filter by status", async () => {

            const matching =
                await helper.createInbox({
                    status: InboxStatus.PROCESSED
                });

            await helper.createInbox({
                status: InboxStatus.PENDING,
            });

            const pageable: Pageable<InboxSort> = {

                page: 1,

                size: 20,

                sortBy: InboxSort.CREATED_AT,

                direction: SortDirection.DESC,

            };

            const page =
                await repository.findAll(
                    {
                        status: InboxStatus.PROCESSED,
                    } as InboxFilter,
                    pageable,
                );

            expect(page.totalElements).toBe(1);

            expect(page.content[0].id).toBe(
                matching.id,
            );

        });

        it("should filter by createdAt range", async () => {

            const before =
                new Date();

            const matching =
                await helper.createInbox();

            const after =
                new Date();

            const pageable: Pageable<InboxSort> = {

                page: 1,

                size: 10,

                sortBy: InboxSort.CREATED_AT,

                direction: SortDirection.ASC,

            };

            const page =
                await repository.findAll(
                    {
                        createdAtMin: before,
                        createdAtMax: after,
                    } as InboxFilter,
                    pageable,
                );

            expect(
                page.content.some(
                    item => item.id === matching.id,
                ),
            ).toBe(true);

        });

        it("should filter by updatedAt range", async () => {

            const before =
                new Date();

            const matching =
                await helper.createInbox();

            const after =
                new Date();

            const pageable: Pageable<InboxSort> = {

                page: 1,

                size: 10,

                sortBy: InboxSort.UPDATED_AT,

                direction: SortDirection.ASC,

            };

            const page =
                await repository.findAll(
                    {
                        updatedAtMin: before,
                        updatedAtMax: after,
                    } as InboxFilter,
                    pageable,
                );

            expect(
                page.content.some(
                    item => item.id === matching.id,
                ),
            ).toBe(true);

        });

        it("should filter by processedAt range", async () => {

            const before =
                new Date();

            const matching =
                await helper.createInbox({
                    status: InboxStatus.PROCESSED,
                    processedAt: new Date(),
                });

            const after =
                new Date();

            const pageable: Pageable<InboxSort> = {

                page: 1,

                size: 10,

                sortBy: InboxSort.PROCESSED_AT,

                direction: SortDirection.ASC,

            };

            const page =
                await repository.findAll(
                    {
                        processedAtMin: before,
                        processedAtMax: after,
                    },
                    pageable,
                );

            expect(
                page.content.some(
                    item => item.id === matching.id,
                ),
            ).toBe(true);

        });

        it("should return an empty page when no records match", async () => {

            const pageable: Pageable<InboxSort> = {

                page: 1,

                size: 10,

                sortBy: InboxSort.CREATED_AT,

                direction: SortDirection.DESC,

            };

            const page =
                await repository.findAll(
                    {
                        source:
                            `nonexistent_${helper.getRandomString(20)}`,
                    } as InboxFilter,
                    pageable,
                );

            expect(page).toBeDefined();

            expect(page.content).toHaveLength(0);

            expect(page.totalElements).toBe(0);

        });

        it("should support ascending sorting", async () => {

            const key =
                helper.getRandomString(8);

            const first =
                await helper.createInbox({
                    source: `aaa_${key}`,
                });

            const second =
                await helper.createInbox({
                    source: `zzz_${key}`,
                });

            const pageable: Pageable<InboxSort> = {

                page: 1,

                size: 10,

                sortBy: InboxSort.SOURCE,

                direction: SortDirection.ASC,

            };

            const page =
                await repository.findAll(
                    {
                        source: key,
                    } as InboxFilter,
                    pageable,
                );

            expect(page.content.length)
                .toBe(2);

            expect(page.content[0].id).toBe(
                first.id,
            );

            expect(page.content[1].id).toBe(
                second.id,
            );

        });

        it("should support descending sorting", async () => {

            const key =
                helper.getRandomString(8);

            const first =
                await helper.createInbox({
                    source: `aaa_${key}`,
                });

            const second =
                await helper.createInbox({
                    source: `zzz_${key}`,
                });

            const pageable: Pageable<InboxSort> = {

                page: 1,

                size: 10,

                sortBy: InboxSort.SOURCE,

                direction: SortDirection.DESC,

            };

            const page = await repository.findAll(
                    {
                        source: key,
                    } as InboxFilter,
                    pageable,
                );

            expect(page.content.length)
                .toBe(2);

            expect(page.content[0].id).toBe(
                second.id,
            );

            expect(page.content[1].id).toBe(
                first.id,
            );

        });

        it("should paginate results correctly", async () => {

            const key =
                helper.getRandomString(8);

            await helper.createInbox({
                source: `source_${key}_1`,
            });

            await helper.createInbox({
                source: `source_${key}_2`,
            });

            await helper.createInbox({
                source: `source_${key}_3`,
            });

            const page1 =
                await repository.findAll(
                    {
                        source: key,
                    } as InboxFilter,
                    {
                        page: 1,
                        size: 2,
                        sortBy: InboxSort.SOURCE,
                        direction: SortDirection.ASC,
                    },
                );

            const page2 =
                await repository.findAll(
                    {
                        source: key,
                    } as InboxFilter,
                    {
                        page: 2,
                        size: 2,
                        sortBy: InboxSort.SOURCE,
                        direction: SortDirection.ASC,
                    },
                );

            expect(page1.content).toHaveLength(2);

            expect(page2.content).toHaveLength(1);

            expect(page1.totalElements).toBe(3);

            expect(page2.totalElements).toBe(3);

        });

    });

});