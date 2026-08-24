import { InboxEntity } from "../entities/inbox.entity";
import { InboxStatus } from "src/utils/enums/inbox-status.enum";
import { UpdateInboxDto } from "../dto/update-inboox.dto";
import { inbox } from "src/infra/database/schema/inbox.schema";

type SchemaInbox = typeof inbox.$inferSelect;

export class InboxMapper {

    static merge(inboxEntity: InboxEntity, dto: Partial<UpdateInboxDto>): void {
        const updatableFields = Object.fromEntries(
            Object.entries(dto).filter(([_, value]) => value !== undefined)
        );

        Object.assign(inboxEntity, updatableFields);
    }

    static toDomain(raw: SchemaInbox): InboxEntity {
        const inboxEntity = new InboxEntity();

        Object.assign(inboxEntity, raw);

        inboxEntity.status = raw.status as unknown as InboxStatus;

        return inboxEntity;
    }

    static toPersistence(inboxEntity: InboxEntity) {
        const { id, source, messageId, payload, status, processedAt, version, createdAt, updatedAt } = inboxEntity;

        return {
            id,
            source,
            messageId,
            payload,
            status,
            processedAt,
            version,
            createdAt,
            updatedAt,
        };
    }
}