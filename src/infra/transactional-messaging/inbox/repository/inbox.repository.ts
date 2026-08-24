import { Injectable } from "@nestjs/common";
import {
    and,
    asc,
    count,
    desc,
    eq,
    gte,
    ilike,
    lte,
    SQL
} from "drizzle-orm";

import { DatabaseService } from "src/infra/database/database.service";
import { IInboxRepository } from "./iinbox.repository";
import { InboxEntity } from "../entities/inbox.entity";
import { InboxFilter } from "../dto/inbox-filter.dto";
import { InboxSort } from "../dto/inbox-page.dto";
import { Page, Pageable } from "src/common/page/page";
import { InboxMapper } from "../mapper/inbox.mapper";
import { inbox } from "src/infra/database/schema/inbox.schema";
import { inArray } from "drizzle-orm";

@Injectable()
export class InboxRepository implements IInboxRepository {

    constructor(
        private readonly database: DatabaseService,
    ) {}

    async deleteAll(): Promise<number> { 
        const deleted = await this.database.connection 
            .delete(inbox) 
            .returning({ id: inbox.id, }); 
            
        return deleted.length; 
    }

    async findByMessageIdAndSource(messageId: string, source: string): Promise<InboxEntity | null> {
         const [rawInbox] = await this.database.connection
            .select()
            .from(inbox)
            .where(and(
                eq(inbox.messageId, messageId),
                eq(inbox.source, source)
            ))
            .limit(1);

        return rawInbox ? InboxMapper.toDomain(rawInbox) : null
    }

    async deleteByIds(ids: string[]): Promise<number> {
        const deleted = await this.database.connection
            .delete(inbox)
            .where(inArray(inbox.id, ids))
            .returning({ id: inbox.id });

        return deleted.length
    }

    async existsByMessageIdAndSource(
        messageId: string,
        source: string,
    ): Promise<boolean> {

        const [rawInbox] = await this.database.connection
            .select({ id: inbox.id })
            .from(inbox)
            .where(
                and(
                    eq(inbox.messageId, messageId),
                    eq(inbox.source, source),
                ),
            )
            .limit(1);

        return !!rawInbox;
    }

    async create(inboxEntity: InboxEntity): Promise<InboxEntity> {
        const [created] = await this.database.connection
            .insert(inbox)
            .values(InboxMapper.toPersistence(inboxEntity))
            .returning();

        return InboxMapper.toDomain(created);
    }

    async findById(id: string): Promise<InboxEntity | null> {
        const [rawInbox] = await this.database.connection
            .select()
            .from(inbox)
            .where(eq(inbox.id, id));

        return rawInbox ? InboxMapper.toDomain(rawInbox) : null;
    }

    async update(inboxEntity: InboxEntity): Promise<InboxEntity> {
        const [updated] = await this.database.connection
            .update(inbox)
            .set({
                ...InboxMapper.toPersistence(inboxEntity),
                version: inboxEntity.version + 1,
                updatedAt: new Date(),
            })
            .where(eq(inbox.id, inboxEntity.id))
            .returning();

        return InboxMapper.toDomain(updated);
    }

    async deleteById(id: string): Promise<boolean> {
        const deleted = await this.database.connection
            .delete(inbox)
            .where(eq(inbox.id, id))
            .returning({ id: inbox.id });

        return deleted.length > 0;
    }


    async findAll(filter: InboxFilter, pageable: Pageable<InboxSort>): Promise<Page<InboxEntity>> {
        const conditions: SQL[] = [];

        if (filter.id) {
            conditions.push(eq(inbox.id, filter.id));
        }

        if (filter.source) {
            conditions.push(ilike(inbox.source, `%${filter.source}%`));
        }

        if (filter.messageId) {
            conditions.push(eq(inbox.messageId, filter.messageId));
        }

        if (filter.payload) {
            conditions.push(ilike(inbox.payload, `%${filter.payload}%`));
        }

        if (filter.status) {
            conditions.push(eq(inbox.status, filter.status));
        }

        if (filter.createdAtMin) {
            conditions.push(gte(inbox.createdAt, filter.createdAtMin));
        }

        if (filter.createdAtMax) {
            conditions.push(lte(inbox.createdAt, filter.createdAtMax));
        }

        if (filter.updatedAtMin) {
            conditions.push(gte(inbox.updatedAt, filter.updatedAtMin));
        }

        if (filter.updatedAtMax) {
            conditions.push(lte(inbox.updatedAt, filter.updatedAtMax));
        }

        if (filter.processedAtMin) {
            conditions.push(gte(inbox.processedAt, filter.processedAtMin));
        }

        if (filter.processedAtMax) {
            conditions.push(lte(inbox.processedAt, filter.processedAtMax));
        }

        const sortableColumns = {
            [InboxSort.SOURCE]: inbox.source,
            [InboxSort.MESSAGE_ID]: inbox.messageId,
            [InboxSort.CREATED_AT]: inbox.createdAt,
            [InboxSort.UPDATED_AT]: inbox.updatedAt,
            [InboxSort.PROCESSED_AT]: inbox.processedAt,
            [InboxSort.STATUS]: inbox.status,
        } as const;

        const sortColumn =
            sortableColumns[pageable.sortBy] ?? inbox.createdAt;

        const rawResults = await this.database.connection
            .select()
            .from(inbox)
            .where(
                conditions.length > 0
                    ? and(...conditions)
                    : undefined
            )
            .orderBy(
                pageable.direction === "asc"
                    ? asc(sortColumn)
                    : desc(sortColumn)
            )
            .limit(pageable.size)
            .offset((pageable.page - 1) * pageable.size);

        const result = rawResults.map((item) => InboxMapper.toDomain(item));

        const [{ totalElements }] = await this.database.connection
            .select({
                totalElements: count(),
            })
            .from(inbox)
            .where(
                conditions.length > 0
                    ? and(...conditions)
                    : undefined
            );

        return new Page(
            result,
            pageable.page,
            pageable.size,
            Number(totalElements),
        );
    }
}