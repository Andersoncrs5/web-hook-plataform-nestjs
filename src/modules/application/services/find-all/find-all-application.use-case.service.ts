import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { IApplicationRepository } from '../../repository/iapplication.repository';
import { Page, Pageable } from 'src/common/page/page';
import { ApplicationEntity } from '../../entities/application.entity';
import { Result } from 'src/common/result/result';
import { ApplicationFilterDto } from '../../dto/filter/application-filter.dto';
import { ApplicationSort } from '../../dto/filter/application-sort.dto';

@Injectable()
export class FindAllApplicationsUseCase {
  constructor(private readonly repository: IApplicationRepository) {}

  async execute(
    filter: ApplicationFilterDto,
    pageable: Pageable<ApplicationSort>,
  ): Promise<Result<Page<ApplicationEntity>>> {
    try {
      const page = await this.repository.findAll(filter, pageable);
      return Result.ok(page);
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException('Error retrieving applications page.');
    }
  }
}
