import { Test, TestingModule } from "@nestjs/testing";
import { InternalServerErrorException } from "@nestjs/common";
import { ExistsApplicationBySlugUseCase } from "./exists-application-by-slug.use-case.service";
import { IApplicationRepository } from "../../repository/iapplication.repository";

describe("ExistsApplicationBySlugUseCase", () => {
    let useCase: ExistsApplicationBySlugUseCase;
    let repository: jest.Mocked<IApplicationRepository>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ExistsApplicationBySlugUseCase,
                {
                    provide: IApplicationRepository,
                    useValue: {
                        existsBySlug: jest.fn(),
                    },
                },
            ],
        }).compile();

        useCase = module.get<ExistsApplicationBySlugUseCase>(
            ExistsApplicationBySlugUseCase,
        );
        repository = module.get(IApplicationRepository);
    });

    it("should be defined", () => {
        expect(useCase).toBeDefined();
    });

    it("should return true when application exists by slug", async () => {
        repository.existsBySlug.mockResolvedValue(true);

        const result = await useCase.execute("my-app");

        expect(result.isSuccess).toBe(true);
        expect(result.value).toBe(true);
        expect(repository.existsBySlug).toHaveBeenCalledWith("my-app");
    });

    it("should return false when application does not exist by slug", async () => {
        repository.existsBySlug.mockResolvedValue(false);

        const result = await useCase.execute("non-existent-slug");

        expect(result.isSuccess).toBe(true);
        expect(result.value).toBe(false);
        expect(repository.existsBySlug).toHaveBeenCalledWith("non-existent-slug");
    });

    it("should return badRequest when slug is empty or contains only spaces", async () => {
        const result = await useCase.execute("");

        expect(result.isFailure).toBe(true);
        expect(result.errors[0]).toBe("Slug cannot be empty");
        expect(repository.existsBySlug).not.toHaveBeenCalled();
    });

    it("should throw InternalServerErrorException on database error", async () => {
        repository.existsBySlug.mockRejectedValue(new Error("Database crash"));

        await expect(useCase.execute("my-app")).rejects.toThrow(
            InternalServerErrorException,
        );
    });
});