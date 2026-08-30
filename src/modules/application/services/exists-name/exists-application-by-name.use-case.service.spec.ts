import { Test, TestingModule } from "@nestjs/testing";
import { InternalServerErrorException } from "@nestjs/common";
import { ExistsApplicationByNameUseCase } from "./exists-application-by-name.use-case.service";
import { IApplicationRepository } from "../../repository/iapplication.repository";

describe("ExistsApplicationByNameUseCase", () => {
    let useCase: ExistsApplicationByNameUseCase;
    let repository: jest.Mocked<IApplicationRepository>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ExistsApplicationByNameUseCase,
                {
                    provide: IApplicationRepository,
                    useValue: {
                        existsByName: jest.fn(),
                    },
                },
            ],
        }).compile();

        useCase = module.get<ExistsApplicationByNameUseCase>(
            ExistsApplicationByNameUseCase,
        );
        repository = module.get(IApplicationRepository);
    });

    it("should be defined", () => {
        expect(useCase).toBeDefined();
    });

    it("should return true when application exists by name", async () => {
        repository.existsByName.mockResolvedValue(true);

        const result = await useCase.execute("My App");

        expect(result.isSuccess).toBe(true);
        expect(result.value).toBe(true);
        expect(repository.existsByName).toHaveBeenCalledWith("My App");
    });

    it("should return false when application does not exist by name", async () => {
        repository.existsByName.mockResolvedValue(false);

        const result = await useCase.execute("Non Existent App");

        expect(result.isSuccess).toBe(true);
        expect(result.value).toBe(false);
        expect(repository.existsByName).toHaveBeenCalledWith("Non Existent App");
    });

    it("should return badRequest when name is empty or contains only spaces", async () => {
        const result = await useCase.execute("   ");

        expect(result.isFailure).toBe(true);
        expect(result.errors[0]).toBe("Name cannot be empty");
        expect(repository.existsByName).not.toHaveBeenCalled();
    });

    it("should throw InternalServerErrorException on database error", async () => {
        repository.existsByName.mockRejectedValue(new Error("Database crash"));

        await expect(useCase.execute("My App")).rejects.toThrow(
            InternalServerErrorException,
        );
    });
});