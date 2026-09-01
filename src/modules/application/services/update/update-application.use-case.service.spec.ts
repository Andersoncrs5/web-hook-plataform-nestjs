import { Test, TestingModule } from "@nestjs/testing";
import { InternalServerErrorException } from "@nestjs/common";
import { UpdateApplicationUseCase } from "./update-application.use-case.service";
import { IApplicationRepository } from "../../repository/iapplication.repository";
import { UpdateApplicationDto } from "../../dto/request/update-application.dto";
import { ApplicationEntity } from "../../entities/application.entity";
import {
    ApplicationTypeEnum,
    ApplicationEnvironmentEnum,
    ApplicationStatusEnum,
} from "src/common/enums/application/application.enums";

describe("UpdateApplicationUseCase", () => {
    let useCase: UpdateApplicationUseCase;
    let repository: jest.Mocked<IApplicationRepository>;

    const validAppId = "123e4567-e89b-12d3-a456-426614174000";
    const validUserId = "987e6543-e21b-12d3-a456-426614174000";
    const invalidUuid = "invalid-uuid-123";

    const mockExistingApp: ApplicationEntity = {
        id: validAppId,
        organizationId: "456e7890-e21b-12d3-a456-426614174000",
        createdBy: validUserId,
        name: "Old App Name",
        slug: "old-app-slug",
        type: ApplicationTypeEnum.WEB,
        environment: ApplicationEnvironmentEnum.PROD,
        status: ApplicationStatusEnum.ACTIVE,
        version: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
    } as ApplicationEntity;

    const mockUpdateDto: UpdateApplicationDto = {
        name: "New App Name",
        slug: "new-app-slug",
        description: "Updated description",
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UpdateApplicationUseCase,
                {
                    provide: IApplicationRepository,
                    useValue: {
                        findById: jest.fn(),
                        update: jest.fn(),
                    },
                },
            ],
        }).compile();

        useCase = module.get<UpdateApplicationUseCase>(UpdateApplicationUseCase);
        repository = module.get(IApplicationRepository);
    });

    it("should be defined", () => {
        expect(useCase).toBeDefined();
    });

    describe("Validation Checks", () => {
        it("should return badRequest when application ID is not a valid UUID", async () => {
            const result = await useCase.execute(invalidUuid, mockUpdateDto, validUserId);

            expect(result.isFailure).toBe(true);
            expect(result.errors[0]).toBe("Id should be a valid UUID");
            expect(repository.findById).not.toHaveBeenCalled();
        });

        it("should return badRequest when user ID is not a valid UUID", async () => {
            const result = await useCase.execute(validAppId, mockUpdateDto, invalidUuid);

            expect(result.isFailure).toBe(true);
            expect(result.errors[0]).toBe("User Id should be a valid UUID");
            expect(repository.findById).not.toHaveBeenCalled();
        });
    });

    describe("Business Rules & Flow", () => {
        it("should update application successfully when user owns it", async () => {
            repository.findById.mockResolvedValue(mockExistingApp);

            const mockUpdatedEntity = {
                ...mockExistingApp,
                ...mockUpdateDto,
                version: 1,
            } as ApplicationEntity;

            repository.update.mockResolvedValue(mockUpdatedEntity);

            const result = await useCase.execute(validAppId, mockUpdateDto, validUserId);

            expect(result.isSuccess).toBe(true);
            expect(result.value.name).toBe("New App Name");
            expect(repository.findById).toHaveBeenCalledWith(validAppId);
            expect(repository.update).toHaveBeenCalled();
        });

        it("should return notFound when application does not exist", async () => {
            repository.findById.mockResolvedValue(null);

            const result = await useCase.execute(validAppId, mockUpdateDto, validUserId);

            expect(result.isFailure).toBe(true);
            expect(result.errors[0]).toBe("Application not found");
            expect(repository.update).not.toHaveBeenCalled();
        });

        it("should return forbidden when user does not own the application", async () => {
            const otherUserUuid = "111e2222-e89b-12d3-a456-426614174000";

            repository.findById.mockResolvedValue({
                ...mockExistingApp,
                createdBy: otherUserUuid,
            });

            const result = await useCase.execute(validAppId, mockUpdateDto, validUserId);

            expect(result.isFailure).toBe(true);
            expect(result.errors[0]).toBe("You do not own this application!");
            expect(repository.update).not.toHaveBeenCalled();
        });
    });

    describe("PostgreSQL Error Handling", () => {
        beforeEach(() => {
            repository.findById.mockResolvedValue(mockExistingApp);
        });

        it("should return conflict when name unique constraint fails (23505)", async () => {
            repository.update.mockRejectedValue({
                cause: {
                    code: "23505",
                    constraint_name: "uk_applications_organization_name",
                    detail: "(name)=(New App Name) already exists.",
                },
            });

            const result = await useCase.execute(validAppId, mockUpdateDto, validUserId);

            expect(result.isFailure).toBe(true);
            expect(result.errors[0]).toBe(`Application name '${mockUpdateDto.name}' already exists.`);
        });

        it("should return conflict when slug unique constraint fails (23505)", async () => {
            repository.update.mockRejectedValue({
                cause: {
                    code: "23505",
                    constraint_name: "uk_applications_slug",
                    detail: "(slug)=(new-app-slug) already exists.",
                },
            });

            const result = await useCase.execute(validAppId, mockUpdateDto, validUserId);

            expect(result.isFailure).toBe(true);
            expect(result.errors[0]).toBe(`Application slug '${mockUpdateDto.slug}' already exists.`);
        });

        it("should return notFound when foreign key constraint fails for organization (23503)", async () => {
            repository.update.mockRejectedValue({
                cause: {
                    code: "23503",
                    constraint_name: "applications_organization_id_fkey",
                    detail: "organization_id",
                },
            });

            const result = await useCase.execute(validAppId, mockUpdateDto, validUserId);

            expect(result.isFailure).toBe(true);
            expect(result.errors[0]).toBe("The specified Organization does not exist.");
        });

        it("should return badRequest on required field null violation (23502)", async () => {
            repository.update.mockRejectedValue({
                cause: { code: "23502", column: "name" },
            });

            const result = await useCase.execute(validAppId, mockUpdateDto, validUserId);

            expect(result.isFailure).toBe(true);
            expect(result.errors[0]).toBe('The field "name" cannot be null.');
        });

        it("should return badRequest when a field exceeds max length (22001)", async () => {
            repository.update.mockRejectedValue({
                cause: { code: "22001" },
            });

            const result = await useCase.execute(validAppId, mockUpdateDto, validUserId);

            expect(result.isFailure).toBe(true);
            expect(result.errors[0]).toBe("One or more fields exceed the maximum allowed length.");
        });

        it("should return badRequest on invalid input format or enum (22P02)", async () => {
            repository.update.mockRejectedValue({
                cause: { code: "22P02" },
            });

            const result = await useCase.execute(validAppId, mockUpdateDto, validUserId);

            expect(result.isFailure).toBe(true);
            expect(result.errors[0]).toBe("Invalid input format or enum value.");
        });

        it("should throw InternalServerErrorException on unhandled database error", async () => {
            repository.update.mockRejectedValue(new Error("Fatal error"));

            await expect(
                useCase.execute(validAppId, mockUpdateDto, validUserId),
            ).rejects.toThrow(InternalServerErrorException);
        });
    });
});