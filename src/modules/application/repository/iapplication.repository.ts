import { IBaseRepository } from "src/common/base/repository/ibase.repository";
import { ApplicationEntity } from "../entities/application.entity";
import { ApplicationFilterDto } from "../dto/filter/application-filter.dto";
import { ApplicationSort } from "../dto/filter/application-sort.dto";
import { Page, Pageable } from "src/common/page/page";

export abstract class IApplicationRepository extends IBaseRepository<ApplicationEntity> {
    abstract existsByName(name: string): Promise<boolean> 
    abstract existsBySlug(slug: string): Promise<boolean> 
    abstract findAll(
        filter: ApplicationFilterDto, 
        pageable: Pageable<ApplicationSort>,
    ): Promise<Page<ApplicationEntity>>
}