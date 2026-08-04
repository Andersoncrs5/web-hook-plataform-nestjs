import { Test, TestingModule } from "@nestjs/testing";

import { IUserRepository } from "../../repository/iuser.repository";
import { User } from "../../entities/user.entity";
import { FindUserByEmailUseCase } from "./find-user-email.use-case.service";

describe("FindUserByEmail ( UnitTest )", () => {

    let service: FindUserByEmailUseCase;
    let repository: jest.Mocked<IUserRepository>;

    const mockRepository = {
        findByEmail: jest.fn(),
    };

    const fakeEmail = "johndoe@example.com";

    const fakeUser: User = {
        id: "user-uuid-1234",
        name: "John Doe",
        fullName: "Johnathan Doe",
        email: fakeEmail,
        passwordHash: "fake-password-hash",
        emailVerified: true,
        status: "ACTIVE" as any,
        lastLoginAt: null,
        version: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
    };

    beforeEach(async () => {
        const module: TestingModule =
            await Test.createTestingModule({
                providers: [
                    FindUserByEmailUseCase,
                    {
                        provide: IUserRepository,
                        useValue: mockRepository,
                    },
                ],
            }).compile();

        service = module.get<FindUserByEmailUseCase>(
            FindUserByEmailUseCase,
        );

        repository = module.get(IUserRepository);
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should be defined and dependencies correctly mocked", () => {
        expect(service).toBeDefined();
        expect(repository).toBeDefined();
    });

    describe("execute", () => {

        it("should successfully find user by email (Happy Path)", async () => {

            repository.findByEmail.mockResolvedValue(
                fakeUser,
            );

            const result =
                await service.execute(fakeEmail);

            expect(result).toBeDefined();
            expect(result.isSuccess).toBe(true);
            expect(result.value).toEqual(fakeUser);

            expect(
                repository.findByEmail,
            ).toHaveBeenCalledTimes(1);

            expect(
                repository.findByEmail,
            ).toHaveBeenCalledWith(fakeEmail);
        });

        it("should return bad request when email is invalid", async () => {

            const invalidEmail = "invalid-email";

            const result =
                await service.execute(invalidEmail);

            expect(result).toBeDefined();
            expect(result.isSuccess).toBe(false);
            expect(result.errors[0]).toBe("Email invalid");

            expect(
                repository.findByEmail,
            ).not.toHaveBeenCalled();
        });

        it("should return bad request when email is empty", async () => {

            const invalidEmail = "";

            const result =
                await service.execute(invalidEmail);

            expect(result).toBeDefined();
            expect(result.isSuccess).toBe(false);
            expect(result.errors[0]).toBe("Email invalid");

            expect(
                repository.findByEmail,
            ).not.toHaveBeenCalled();
        });

        it("should return bad request when email has invalid format", async () => {

            const invalidEmail = "john.doe@";

            const result =
                await service.execute(invalidEmail);

            expect(result).toBeDefined();
            expect(result.isSuccess).toBe(false);
            expect(result.errors[0]).toBe("Email invalid");

            expect(
                repository.findByEmail,
            ).not.toHaveBeenCalled();
        });

        it("should return not found when user does not exist", async () => {

            repository.findByEmail.mockResolvedValue(
                null,
            );

            const result =
                await service.execute(fakeEmail);

            expect(result).toBeDefined();
            expect(result.isSuccess).toBe(false);
            expect(result.errors[0]).toBe("User not found");

            expect(
                repository.findByEmail,
            ).toHaveBeenCalledTimes(1);

            expect(
                repository.findByEmail,
            ).toHaveBeenCalledWith(fakeEmail);
        });

        it("should propagate repository errors", async () => {

            const dbError =
                new Error("Database connection failed");

            repository.findByEmail.mockRejectedValue(
                dbError,
            );

            await expect(
                service.execute(fakeEmail),
            ).rejects.toThrow(
                "Database connection failed",
            );

            expect(
                repository.findByEmail,
            ).toHaveBeenCalledTimes(1);

            expect(
                repository.findByEmail,
            ).toHaveBeenCalledWith(fakeEmail);
        });
    });
});

