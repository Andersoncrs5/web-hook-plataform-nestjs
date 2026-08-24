import { BaseEntity } from "src/common/base/entity/base.entity.base";
import { InboxStatus } from "src/utils/enums/inbox-status.enum";

export class InboxEntity extends BaseEntity {
    source: string
    messageId: string
    payload?: string
    status: InboxStatus
    processedAt: Date | null
}