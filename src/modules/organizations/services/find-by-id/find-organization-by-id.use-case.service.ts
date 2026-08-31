import { Injectable } from "@nestjs/common";
import { IOrganizationRepository } from "../../repository/iorganization.repository";
import { OrganizationEntity } from "../../entities/organization.entity";
import { Result } from "src/common/result/result";
import { isUUID } from "class-validator";

@Injectable()
export class FindOrganizationByIdUseCase {
    constructor(
        private readonly repository: IOrganizationRepository
    ){}

    async execute(id: string): Promise<Result<OrganizationEntity>> {
        if (!isUUID(id)) return Result.badRequest('Id should be a UUID');

        const org: OrganizationEntity | null = await this.repository.findById(id);

        if (org == null) {
            return Result.notFound("Organization not found")
        }

        return Result.ok(org)
    }

}