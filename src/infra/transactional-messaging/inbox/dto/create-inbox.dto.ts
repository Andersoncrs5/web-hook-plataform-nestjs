export class CreateInboxDto<T> {
    source: string
    messageId: string
    payload?: T
}