import { Injectable, InternalServerErrorException, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { BootstrapTask } from "../../contracts/bootstrap-task.interface";

import { CreateUserRoleService } from "src/modules/user-role/services/create/create-user-role.use-case.service";
import { FindRoleByNameUseCase } from "src/modules/roles/services/find-name/find-role-by-name.use-case.service";
import { FindUserByEmailUseCase } from "src/modules/user/services/find-email/find-user-email.use-case.service";
import { ExistsByRoleIdAndUserIdUseCase } from "src/modules/user-role/services/exists-by-role-id-user-id/exists-by-role-id-user-id.use-case.service";
import { CreateUserRoleDto } from "src/modules/user-role/dto/create-user-role.dto";

@Injectable()
export class LinkRoleMasterToMasterBootstrapTask implements BootstrapTask {
    private readonly logger = new Logger(LinkRoleMasterToMasterBootstrapTask.name);

    constructor(
        private readonly createUserRole: CreateUserRoleService,
        private readonly findRoleByName: FindRoleByNameUseCase,
        private readonly findUserByEmail: FindUserByEmailUseCase,
        private readonly existsRoleUser: ExistsByRoleIdAndUserIdUseCase,
        private readonly configService: ConfigService,
    ) {}

    async execute(): Promise<void> {
        const emailMaster = this.configService.getOrThrow<string>("EMAIL_MASTER");

        const masterUserResult = await this.findUserByEmail.execute(emailMaster);
        if (masterUserResult.isFailure) {
            throw new InternalServerErrorException(
                `Failed to find master user with email "${emailMaster}".`,
            );
        }

        const masterRoleResult = await this.findRoleByName.execute("MASTER");
        if (masterRoleResult.isFailure) {
            throw new InternalServerErrorException(
                `Failed to find "MASTER" role.`,
            );
        }

        const masterUser = masterUserResult.value;
        const masterRole = masterRoleResult.value;

        const checkAssociationResult = await this.existsRoleUser.execute(
            masterRole.id,
            masterUser.id,
        );

        if (checkAssociationResult.isFailure) {
            throw new InternalServerErrorException(
                `Failed to check association between MASTER role and master user.`,
            );
        }

        if (checkAssociationResult.value) {
            this.logger.debug(
                `Master user "${emailMaster}" already has the MASTER role assigned.`,
            );
            return;
        }

        const dto: CreateUserRoleDto = {
            roleId: masterRole.id,
            userId: masterUser.id,
        };

        const linkResult = await this.createUserRole.execute(dto);

        if (linkResult.isFailure) {
            throw new Error(
                `Failed to link MASTER role to master user "${emailMaster}".`,
            );
        }

        this.logger.log(
            `Linked MASTER role to master user "${emailMaster}" during application bootstrap.`,
        );
    }
}