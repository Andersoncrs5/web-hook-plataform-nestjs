import { Page, Pageable } from "src/common/page/page";
import { InboxFilter } from "../dto/inbox-filter.dto";
import { InboxEntity } from "../entities/inbox.entity";
import { InboxSort } from "../dto/inbox-page.dto";

export abstract class IInboxRepository {

    abstract existsByMessageIdAndSource(messageId: string, source: string): Promise<boolean>;

    abstract deleteByIds(ids: string[]): Promise<number>;

    abstract findAll(filter: InboxFilter, pageable: Pageable<InboxSort>): Promise<Page<InboxEntity>>;

    abstract deleteById(id: string): Promise<boolean>;

    abstract update(inbox: InboxEntity): Promise<InboxEntity>;

    abstract findById(id: string): Promise<InboxEntity | null>;

    abstract create(inbox: InboxEntity): Promise<InboxEntity>;

    abstract findByMessageIdAndSource(messageId: string, source: string): Promise<InboxEntity | null>;
}