import { Test, TestingModule } from "@nestjs/testing";
import { InternalServerErrorException } from "@nestjs/common";
import { IApplicationRepository } from "../../repository/iapplication.repository";
import { FindOrganizationByIdUseCase } from "src/modules/organizations/services/find-by-id/find-organization-by-id.use-case.service";
import { CreateApplicationDto } from "../../dto/request/create-application.dto";
import { Result } from "src/common/result/result";
import { ApplicationEntity } from "../../entities/application.entity";
import {
    ApplicationTypeEnum,
    ApplicationEnvironmentEnum,
    ApplicationStatusEnum,
} from "src/common/enums/application/application.enums";
import { CreateApplicationUseCase } from "./create-application.use-case.service";

describe("CreateApplicationUseCase", () => {
    let useCase: CreateApplicationUseCase;
    let repository: jest.Mocked<IApplicationRepository>;
    let findOrgUseCase: jest.Mocked<FindOrganizationByIdUseCase>;

    const mockUserId = "user-uuid-123";
    const mockOrgId = "org-uuid-123";

    const mockDto: CreateApplicationDto = {
        name: "My App",
        slug: "my-app",
        organizationId: mockOrgId,
        type: ApplicationTypeEnum.WEB,
        environment: ApplicationEnvironmentEnum.PROD,
        status: ApplicationStatusEnum.ACTIVE,
    };

    const mockOrganization = {
        id: mockOrgId,
        name: "My Org",
        userId: mockUserId, // Pertence ao mockUserId
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CreateApplicationUseCase,
                {
                    provide: IApplicationRepository,
                    useValue: {
                        create: jest.fn(),
                    },
                },
                {
                    provide: FindOrganizationByIdUseCase,
                    useValue: {
                        execute: jest.fn(),
                    },
                },
            ],
        }).compile();

        useCase = module.get<CreateApplicationUseCase>(CreateApplicationUseCase);
        repository = module.get(IApplicationRepository);
        findOrgUseCase = module.get(FindOrganizationByIdUseCase);
    });

    it("should be defined", () => {
        expect(useCase).toBeDefined();
    });

    it("should create application successfully when data is valid", async () => {
        findOrgUseCase.execute.mockResolvedValue(Result.ok(mockOrganization as any));

        const mockCreatedEntity = {
            id: "app-uuid-123",
            ...mockDto,
            createdBy: mockUserId,
        } as ApplicationEntity;

        repository.create.mockResolvedValue(mockCreatedEntity);

        const result = await useCase.execute(mockDto, mockUserId);

        expect(result.isSuccess).toBe(true);
        expect(result.value).toEqual(mockCreatedEntity);
        expect(findOrgUseCase.execute).toHaveBeenCalledWith(mockOrgId);
        expect(repository.create).toHaveBeenCalled();
    });

    it("should return failure when organization is not found", async () => {
        findOrgUseCase.execute.mockResolvedValue(
            Result.notFound("Organization not found"),
        );

        const result = await useCase.execute(mockDto, mockUserId);

        expect(result.isFailure).toBe(true);
        expect(repository.create).not.toHaveBeenCalled();
    });

    it("should return forbidden when user does not own the organization", async () => {
        findOrgUseCase.execute.mockResolvedValue(
            Result.ok({
                ...mockOrganization,
                userId: "other-user-uuid", // Dono diferente
            } as any),
        );

        const result = await useCase.execute(mockDto, mockUserId);

        expect(result.isFailure).toBe(true);
        expect(repository.create).not.toHaveBeenCalled();
    });

    describe("PostgreSQL Error Handling", () => {

        beforeEach(() => {
            findOrgUseCase.execute.mockResolvedValue(Result.ok(mockOrganization as any));
        });

        it("should return conflict when application name already exists (23505)", async () => {
            const pgError = {
                code: "23505",
                constraint_name: "uk_applications_organization_name",
                detail: "(name)=(My App) already exists.",
            };
            repository.create.mockRejectedValue({ cause: pgError });

            const result = await useCase.execute(mockDto, mockUserId);

            expect(result.isFailure).toBe(true);
            expect(result.errors[0]).toBe(`Application name '${mockDto.name}' already exists.`);
        });

        it("should return conflict when application slug already exists (23505)", async () => {
            const pgError = {
                code: "23505",
                constraint_name: "uk_applications_slug",
                detail: "(slug)=(my-app) already exists.",
            };
            repository.create.mockRejectedValue({ cause: pgError });

            const result = await useCase.execute(mockDto, mockUserId);

            expect(result.isFailure).toBe(true);
            expect(result.errors[0]).toBe(`Application slug '${mockDto.slug}' already exists.`);
        });

        it("should return not found when organization foreign key fails (23503)", async () => {
            const pgError = {
                code: "23503",
                constraint_name: "applications_organization_id_fkey",
                detail: "Key (organization_id)=(123) is not present in table.",
            };
            repository.create.mockRejectedValue({ cause: pgError });

            const result = await useCase.execute(mockDto, mockUserId);

            expect(result.isFailure).toBe(true);
            expect(result.errors[0]).toBe("The specified Organization does not exist.");
        });

        it("should return bad request when a required field is null (23502)", async () => {
            const pgError = {
                code: "23502",
                column: "name",
            };
            repository.create.mockRejectedValue({ cause: pgError });

            const result = await useCase.execute(mockDto, mockUserId);

            expect(result.isFailure).toBe(true);
            expect(result.errors[0]).toBe('The field "name" cannot be null.');
        });

        it("should return bad request when a field exceeds max length (22001)", async () => {
            const pgError = {
                code: "22001",
            };
            repository.create.mockRejectedValue({ cause: pgError });

            const result = await useCase.execute(mockDto, mockUserId);

            expect(result.isFailure).toBe(true);
            expect(result.errors[0]).toBe("One or more fields exceed the maximum allowed length.");
        });

        it("should return bad request on invalid text representation or enum (22P02)", async () => {
            const pgError = {
                code: "22P02",
            };
            repository.create.mockRejectedValue({ cause: pgError });

            const result = await useCase.execute(mockDto, mockUserId);

            expect(result.isFailure).toBe(true);
            expect(result.errors[0]).toBe("Invalid input format or enum value.");
        });

        it("should throw InternalServerErrorException for unknown errors", async () => {
            repository.create.mockRejectedValue(new Error("Database offline"));

            await expect(useCase.execute(mockDto, mockUserId)).rejects.toThrow(
                InternalServerErrorException,
            );
        });
    });
});