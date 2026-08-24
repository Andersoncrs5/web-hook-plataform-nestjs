import { InboxStatus } from "src/utils/enums/inbox-status.enum"

export class UpdateInboxDto {
    source?: string
    status?: InboxStatus
    processedAt?: Date
}