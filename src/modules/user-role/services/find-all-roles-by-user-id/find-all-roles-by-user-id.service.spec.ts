import { Test, TestingModule } from "@nestjs/testing";
import { InternalServerErrorException } from "@nestjs/common";

import { IUserRoleRepository } from "../../repository/iuser-role.repository";
import { Role } from "src/modules/roles/entities/role.entity";
import { FindAllRolesByUserIdUseCase } from "./find-all-roles-by-user-id.service";

describe("FindAllRolesByUserIdUseCase ( UnitTest )", () => {

    let service: FindAllRolesByUserIdUseCase;
    let repository: jest.Mocked<IUserRoleRepository>;

    const mockRepository = {
        findAllRolesByUserId: jest.fn(),
    };

    const fakeUserId = "user-uuid-1234";

    const fakeRoles: Role[] = [
        {
            id: "role-uuid-1",
            name: "ADMIN",
            description: "Administrator",
            isActive: true,
            version: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
            
        },
        {
            id: "role-uuid-2",
            name: "USER",
            description: "Regular user",
            isActive: true,
            version: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
            
        },
    ];

    beforeEach(async () => {
        const module: TestingModule =
            await Test.createTestingModule({
                providers: [
                    FindAllRolesByUserIdUseCase,
                    {
                        provide: IUserRoleRepository,
                        useValue: mockRepository,
                    },
                ],
            }).compile();

        service = module.get<FindAllRolesByUserIdUseCase>(
            FindAllRolesByUserIdUseCase,
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

        it("should successfully return all roles from user", async () => {

            repository.findAllRolesByUserId
                .mockResolvedValue(fakeRoles);

            const result =
                await service.execute(fakeUserId);

            expect(result).toBeDefined();
            expect(result.isSuccess).toBe(true);
            expect(result.value).toEqual(fakeRoles);

            expect(
                repository.findAllRolesByUserId,
            ).toHaveBeenCalledTimes(1);

            expect(
                repository.findAllRolesByUserId,
            ).toHaveBeenCalledWith(fakeUserId);
        });

        it("should return an empty array when user has no roles", async () => {

            repository.findAllRolesByUserId
                .mockResolvedValue([]);

            const result =
                await service.execute(fakeUserId);

            expect(result.isSuccess).toBe(true);
            expect(result.value).toEqual([]);

            expect(
                repository.findAllRolesByUserId,
            ).toHaveBeenCalledTimes(1);

            expect(
                repository.findAllRolesByUserId,
            ).toHaveBeenCalledWith(fakeUserId);
        });

        it("should throw InternalServerErrorException when repository throws an error", async () => {

            const dbError =
                new Error("Database connection failed");

            repository.findAllRolesByUserId
                .mockRejectedValue(dbError);

            await expect(
                service.execute(fakeUserId),
            ).rejects.toThrow(
                InternalServerErrorException,
            );

            await expect(
                service.execute(fakeUserId),
            ).rejects.toThrow(
                "An unexpected error occurred while finding user roles.",
            );

            expect(
                repository.findAllRolesByUserId,
            ).toHaveBeenCalledTimes(2);
        });
    });
});