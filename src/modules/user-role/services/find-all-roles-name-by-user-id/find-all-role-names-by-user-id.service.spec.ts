import { Test, TestingModule } from "@nestjs/testing";
import { InternalServerErrorException } from "@nestjs/common";

import { IUserRoleRepository } from "../../repository/iuser-role.repository";
import { FindAllRoleNamesByUserIdUseCase } from "./find-all-role-names-by-user-id.service";

describe("FindAllRoleNamesByUserIdUseCase ( UnitTest )", () => {

    let service: FindAllRoleNamesByUserIdUseCase;
    let repository: jest.Mocked<IUserRoleRepository>;

    const mockRepository = {
        findAllRoleNamesByUserId: jest.fn(),
    };

    const fakeUserId = "user-uuid-1234";

    const fakeRoleNames = [
        "ADMIN",
        "USER",
        "MODERATOR",
    ];

    beforeEach(async () => {
        const module: TestingModule =
            await Test.createTestingModule({
                providers: [
                    FindAllRoleNamesByUserIdUseCase,
                    {
                        provide: IUserRoleRepository,
                        useValue: mockRepository,
                    },
                ],
            }).compile();

        service = module.get<FindAllRoleNamesByUserIdUseCase>(
            FindAllRoleNamesByUserIdUseCase,
        );

        repository = module.get(IUserRoleRepository);
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should be defined and dependencies correctly mocked", () => {
        expect(service).toBeDefined();
        expect(repository).toBeDefined();
    });

    describe("execute", () => {

        it("should successfully return all role names from user", async () => {

            repository.findAllRoleNamesByUserId
                .mockResolvedValue(fakeRoleNames);

            const result =
                await service.execute(fakeUserId);

            expect(result).toBeDefined();
            expect(result.isSuccess).toBe(true);
            expect(result.value).toEqual(fakeRoleNames);

            expect(
                repository.findAllRoleNamesByUserId,
            ).toHaveBeenCalledTimes(1);

            expect(
                repository.findAllRoleNamesByUserId,
            ).toHaveBeenCalledWith(fakeUserId);
        });

        it("should return an empty array when user has no roles", async () => {

            repository.findAllRoleNamesByUserId
                .mockResolvedValue([]);

            const result =
                await service.execute(fakeUserId);

            expect(result.isSuccess).toBe(true);
            expect(result.value).toEqual([]);

            expect(
                repository.findAllRoleNamesByUserId,
            ).toHaveBeenCalledTimes(1);

            expect(
                repository.findAllRoleNamesByUserId,
            ).toHaveBeenCalledWith(fakeUserId);
        });

        it("should throw InternalServerErrorException when repository throws an error", async () => {

            const dbError =
                new Error("Database connection failed");

            repository.findAllRoleNamesByUserId
                .mockRejectedValue(dbError);

            await expect(
                service.execute(fakeUserId),
            ).rejects.toThrow(
                InternalServerErrorException,
            );

            await expect(
                service.execute(fakeUserId),
            ).rejects.toThrow(
                "An unexpected error occurred while finding user role names.",
            );

            expect(
                repository.findAllRoleNamesByUserId,
            ).toHaveBeenCalledTimes(2);
        });
    });
});