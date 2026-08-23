import { Global, Module } from "@nestjs/common";
import { CreateInboxUseCase } from "./inbox/services/create-inbox/creare-inbox.use-case.service";
import { DeleteInboxByIdUseCase } from "./inbox/services/delete-inbox/delete-inbox-by-id.use-case.service";
import { ExistsInboxByMessageIdAndSourceUseCase } from "./inbox/services/exists-by-message-id-and-source/exists-by-message-id-and-source.use-case.service";
import { FindByMessageIdAndSourceUseCase } from "./inbox/services/find-by-message-id-and-source/find-by-message-id-and-source.service";
import { UpdateInboxUseCase } from "./inbox/services/update-inbox/update-inbox.use-case.service";
import { IInboxRepository } from "./inbox/repository/iinbox.repository";
import { InboxRepository } from "./inbox/repository/inbox.repository";

@Global()
@Module({
    providers: [
        InboxRepository,

        {
            provide: IInboxRepository,
            useExisting: InboxRepository,
        },

        CreateInboxUseCase,
        DeleteInboxByIdUseCase,
        ExistsInboxByMessageIdAndSourceUseCase,
        FindByMessageIdAndSourceUseCase,
        UpdateInboxUseCase,
    ],

    exports: [
        InboxRepository,
        IInboxRepository,

        CreateInboxUseCase,
        DeleteInboxByIdUseCase,
        ExistsInboxByMessageIdAndSourceUseCase,
        FindByMessageIdAndSourceUseCase,
        UpdateInboxUseCase,
    ],
})
export class TransactionalMessagingModule {}