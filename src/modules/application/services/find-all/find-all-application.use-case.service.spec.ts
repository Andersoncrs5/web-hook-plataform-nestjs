import { Test, TestingModule } from "@nestjs/testing";
import { InternalServerErrorException } from "@nestjs/common";
import { IApplicationRepository } from "../../repository/iapplication.repository";
import { Page, Pageable, SortDirection } from "src/common/page/page";
import { ApplicationEntity } from "../../entities/application.entity";
import { FindAllApplicationsUseCase } from "./find-all-application.use-case.service";
import { ApplicationFilterDto } from "../../dto/filter/application-filter.dto";
import { ApplicationSort } from "../../dto/filter/application-sort.dto";

describe("FindAllApplicationsUseCase", () => {
    let useCase: FindAllApplicationsUseCase;
    let repository: jest.Mocked<IApplicationRepository>;

    const mockFilter: ApplicationFilterDto = {
        name: "My App",
    };

    const mockPageable: Pageable<ApplicationSort> = {
        page: 1,
        size: 10,
        sortBy: ApplicationSort.CREATED_AT,
        direction: SortDirection.DESC,
    };

    const mockPageResult = new Page<ApplicationEntity>(
        [
            {
                id: "app-123",
                name: "My App",
            } as ApplicationEntity,
        ],
        1,
        10,
        1,
    );

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                FindAllApplicationsUseCase,
                {
                    provide: IApplicationRepository,
                    useValue: {
                        findAll: jest.fn(),
                    },
                },
            ],
        }).compile();

        useCase = module.get<FindAllApplicationsUseCase>(FindAllApplicationsUseCase);
        repository = module.get(IApplicationRepository);
    });

    it("should be defined", () => {
        expect(useCase).toBeDefined();
    });

    it("should return a page of applications successfully", async () => {
        repository.findAll.mockResolvedValue(mockPageResult);

        const result = await useCase.execute(mockFilter, mockPageable);

        expect(result.isSuccess).toBe(true);
        expect(result.value).toEqual(mockPageResult);
        expect(repository.findAll).toHaveBeenCalledWith(mockFilter, mockPageable);
    });

    it("should throw InternalServerErrorException when repository fails", async () => {
        repository.findAll.mockRejectedValue(new Error("Database connection failure"));

        await expect(
            useCase.execute(mockFilter, mockPageable),
        ).rejects.toThrow(InternalServerErrorException);
    });
});