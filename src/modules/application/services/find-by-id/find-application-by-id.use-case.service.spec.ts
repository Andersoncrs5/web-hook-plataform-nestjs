import { Test, TestingModule } from "@nestjs/testing";
import { InternalServerErrorException } from "@nestjs/common";
import { IApplicationRepository } from "../../repository/iapplication.repository";
import { ApplicationEntity } from "../../entities/application.entity";
import { FindApplicationByIdUseCase } from "./find-application-by-id.use-case.service";

describe("FindApplicationByIdUseCase", () => {
    let useCase: FindApplicationByIdUseCase;
    let repository: jest.Mocked<IApplicationRepository>;

    const validUuid = "123e4567-e89b-12d3-a456-426614174000";
    const invalidUuid = "invalid-uuid-123";

    const mockApplication = {
        id: validUuid,
        name: "My Application",
        slug: "my-application",
    } as ApplicationEntity;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                FindApplicationByIdUseCase,
                {
                    provide: IApplicationRepository,
                    useValue: {
                        findById: jest.fn(),
                    },
                },
            ],
        }).compile();

        useCase = module.get<FindApplicationByIdUseCase>(FindApplicationByIdUseCase);
        repository = module.get(IApplicationRepository);
    });

    it("should be defined", () => {
        expect(useCase).toBeDefined();
    });

    it("should return badRequest when id is not a valid UUID", async () => {
        const result = await useCase.execute(invalidUuid);

        expect(result.isFailure).toBe(true);
        expect(result.errors[0]).toBe("Id should be a valid UUID");
        expect(repository.findById).not.toHaveBeenCalled();
    });

    it("should return notFound when application does not exist", async () => {
        repository.findById.mockResolvedValue(null);

        const result = await useCase.execute(validUuid);

        expect(result.isFailure).toBe(true);
        expect(result.errors[0]).toBe("Application not found");
        expect(repository.findById).toHaveBeenCalledWith(validUuid);
    });

    it("should return application successfully when id exists and is valid", async () => {
        repository.findById.mockResolvedValue(mockApplication);

        const result = await useCase.execute(validUuid);

        expect(result.isSuccess).toBe(true);
        expect(result.value).toEqual(mockApplication);
        expect(repository.findById).toHaveBeenCalledWith(validUuid);
    });

    it("should throw InternalServerErrorException when repository throws an error", async () => {
        repository.findById.mockRejectedValue(new Error("Database failure"));

        await expect(useCase.execute(validUuid)).rejects.toThrow(
            InternalServerErrorException,
        );
    });
});