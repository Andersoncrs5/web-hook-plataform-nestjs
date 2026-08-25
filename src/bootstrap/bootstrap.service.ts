import {
    Inject,
    Injectable,
    Logger,
    OnApplicationBootstrap,
} from "@nestjs/common";

import {
    BOOTSTRAP_TASK,
    BootstrapTask,
} from "./contracts/bootstrap-task.interface";

@Injectable()
export class BootstrapService
    implements OnApplicationBootstrap {

    private readonly logger =
        new Logger(BootstrapService.name);

    constructor(
        @Inject(BOOTSTRAP_TASK)
        private readonly tasks: BootstrapTask[],
    ) {}

    async onApplicationBootstrap(): Promise<void> {
        await this.execute();
    }

    async execute(): Promise<void> {
        this.logger.log(
            "Starting application bootstrap...",
        );

        for (const task of this.tasks) {
            await task.execute();
        }

        this.logger.log(
            "Application bootstrap completed.",
        );
    }
}