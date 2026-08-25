import { Injectable, InternalServerErrorException, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { BootstrapTask } from "../../contracts/bootstrap-task.interface";

import { CreateUserUseCase } from "src/modules/user/services/create-user/create-user.use-case.service";
import { ExistsUserByEmailUseCase } from "src/modules/user/services/exists-email/exists-by-email.service";
import { CreateUserDto } from "src/modules/user/dto/create-user.dto";

@Injectable()
export class MasterBootstrapTask implements BootstrapTask {
    private readonly logger = new Logger(MasterBootstrapTask.name);

    constructor(
        private readonly createUser: CreateUserUseCase,
        private readonly existsUser: ExistsUserByEmailUseCase,
        private readonly configService: ConfigService,
    ) {}

    async execute(): Promise<void> {
        const emailMaster = this.configService.getOrThrow<string>("EMAIL_MASTER");
        const passwordMaster = this.configService.getOrThrow<string>("PASSWORD_MASTER");
        const nameMaster = this.configService.getOrThrow<string>("NAME_MASTER");
        const fullNameMaster = this.configService.getOrThrow<string>("FULL_NAME_MASTER");

        const checkEmail = await this.existsUser.execute(emailMaster);

        if (checkEmail.isFailure) {
            throw new InternalServerErrorException(
                `Failed to check master user existence for email "${emailMaster}".`,
            );
        }

        if (checkEmail.value) {
            this.logger.debug(`Master user "${emailMaster}" already exists.`);
            return;
        }

        const dto: CreateUserDto = {
            name: nameMaster,
            email: emailMaster,
            fullName: fullNameMaster,
            password: passwordMaster,
        };

        const result = await this.createUser.execute(dto);

        if (result.isFailure) {
            throw new Error(
                `Failed to create master user "${emailMaster}".`,
            );
        }

        this.logger.log(
            `Master user "${emailMaster}" created during application bootstrap.`,
        );
    }
}