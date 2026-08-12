import { BaseFilter } from "src/common/base/filter/filter.base";
import { InboxStatus } from "src/utils/enums/inbox-status.enum";

export class InboxFilter extends BaseFilter {
    source?: string
    messageId?: string
    payload?: string
    status?: InboxStatus
    processedAtMin: Date
    processedAtMax: Date
}