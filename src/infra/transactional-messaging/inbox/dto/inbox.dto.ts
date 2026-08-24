import { BaseDto } from "src/common/base/dto/base-dto.base";
import { InboxStatus } from "src/utils/enums/inbox-status.enum";

export class InboxDto extends BaseDto {
    source: string
    messageId: string
    payload?: string
    status: InboxStatus
    processedAt: Date
}