import { Injectable } from "@nestjs/common";
import { IOrganizationRepository } from "../../repository/iorganization.repository";
import { OrganizationEntity } from "../../entities/organization.entity";
import { isUUID } from "class-validator";
import { Result } from "src/common/result/result";

@Injectable()
export class DeleteOrganizationByIdUseCase {
    constructor(
        private readonly repository: IOrganizationRepository
    ){}

    async execute(id: string, userId: string) {
        if (!isUUID(id)) return Result.badRequest('Id should be a UUID');

        const org: OrganizationEntity | null = await this.repository.findById(id);

        if (org == null) {
            return Result.notFound("Organization not found")
        }

        if (org.userId !== userId) {
            return Result.forb("You do not own this organization")
        }

        const result: boolean = await this.repository.deleteById(org.id)
        
        return Result.ok(org)
    }

}