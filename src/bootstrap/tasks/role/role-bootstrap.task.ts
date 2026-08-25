import { Injectable, InternalServerErrorException, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { BootstrapTask } from "../../contracts/bootstrap-task.interface";

import { CreateRoleUseCase } from "src/modules/roles/services/create-role/create-role.use-case.service";
import { CheckRoleExistsByNameUseCase } from "src/modules/roles/services/exists-name/check-role-exists-by-name.use-case.service";

@Injectable()
export class RoleBootstrapTask implements BootstrapTask {
    private readonly logger = new Logger(RoleBootstrapTask.name);

    constructor(
        private readonly createRole: CreateRoleUseCase,
        private readonly existsRoleByName: CheckRoleExistsByNameUseCase,
        private readonly configService: ConfigService,
    ) {}

    async execute(): Promise<void> {
        const rawRoles = this.configService.getOrThrow<string[] | string>("ROLES");

        const roles = Array.isArray(rawRoles)
            ? rawRoles
            : rawRoles.split(",").map((role) => role.trim());
        
        if (!roles.includes("MASTER")) {
            throw new InternalServerErrorException(
                'Required role "MASTER" is missing from ROLES environment configuration.',
            );
        }

        for (const name of roles) {
            const exists = await this.existsRoleByName.execute(name);

            if (exists.isFailure) {
                throw new Error(
                    `Failed to check role "${name}" existence.`,
                );
            }

            if (exists.value) {
                this.logger.debug(`Role "${name}" already exists.`);
                continue;
            }

            const createResult = await this.createRole.execute({
                name,
                description: `Default ${name} role`,
                isActive: true,
            });

            if (createResult.isFailure) {
                throw new Error(
                    `Failed to create default role "${name}".`,
                );
            }

            this.logger.log(
                `Role "${name}" created during application bootstrap.`,
            );
        }
    }
}