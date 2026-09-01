import { Test, TestingModule } from "@nestjs/testing";
import { InternalServerErrorException } from "@nestjs/common";
import { IApplicationRepository } from "../../repository/iapplication.repository";
import { ApplicationEntity } from "../../entities/application.entity";
import { DeleteApplicationByIdUseCase } from "./delete-application-by-id.use-case.service";

describe("DeleteApplicationByIdUseCase", () => {
    let useCase: DeleteApplicationByIdUseCase;
    let repository: jest.Mocked<IApplicationRepository>;

    const mockAppId = "app-uuid-123";
    const mockUserId = "user-uuid-123";

    const mockApplication = {
        id: mockAppId,
        name: "Test App",
        createdBy: mockUserId,
    } as ApplicationEntity;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DeleteApplicationByIdUseCase,
                {
                    provide: IApplicationRepository,
                    useValue: {
                        findById: jest.fn(),
                        deleteByIdAndCount: jest.fn(),
                    },
                },
            ],
        }).compile();

        useCase = module.get<DeleteApplicationByIdUseCase>(DeleteApplicationByIdUseCase);
        repository = module.get(IApplicationRepository);
    });

    it("should delete application successfully when user is the owner", async () => {
        repository.findById.mockResolvedValue(mockApplication);
        repository.deleteByIdAndCount.mockResolvedValue(1);

        const result = await useCase.execute(mockAppId, mockUserId);

        expect(result.isSuccess).toBe(true);
        expect(repository.findById).toHaveBeenCalledWith(mockAppId);
        expect(repository.deleteByIdAndCount).toHaveBeenCalledWith(mockAppId);
    });

    it("should return not found when application does not exist", async () => {
        repository.findById.mockResolvedValue(null);

        const result = await useCase.execute(mockAppId, mockUserId);

        expect(result.isFailure).toBe(true);
        expect(repository.deleteByIdAndCount).not.toHaveBeenCalled();
    });

    it("should return forbidden and NOT delete when user does not own the application", async () => {
        repository.findById.mockResolvedValue({
            ...mockApplication,
            createdBy: "other-user-id",
        });

        const result = await useCase.execute(mockAppId, mockUserId);

        expect(result.isFailure).toBe(true);
        expect(repository.deleteByIdAndCount).not.toHaveBeenCalled(); // Garante que a deleção NÃO foi chamada!
    });

    it("should return bad request if deletion fails due to foreign key constraint (23503)", async () => {
        repository.findById.mockResolvedValue(mockApplication);
        repository.deleteByIdAndCount.mockRejectedValue({
            cause: { code: "23503", constraint: "fk_some_relation" },
        });

        const result = await useCase.execute(mockAppId, mockUserId);

        expect(result.isFailure).toBe(true);
        expect(result.errors[0]).toBe(
            "Cannot delete application because it is referenced by other resources.",
        );
    });

    it("should throw InternalServerErrorException for unexpected database errors", async () => {
        repository.findById.mockResolvedValue(mockApplication);
        repository.deleteByIdAndCount.mockRejectedValue(new Error("Database crash"));

        await expect(useCase.execute(mockAppId, mockUserId)).rejects.toThrow(
            InternalServerErrorException,
        );
    });
});