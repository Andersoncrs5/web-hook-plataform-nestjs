import { Test, TestingModule } from "@nestjs/testing";

import { IUserRoleRepository } from "../../repository/iuser-role.repository";
import { UserRole } from "../../entities/user-role.entity";

import { Page, Pageable } from "src/common/page/page";
import { FindAllUserRoleUseCase } from "./find-all-user-role.use-case.service";
import { UserRoleFilter } from "../../dto/user-role-filter.dto";
import { UserRoleSort } from "../../dto/user-role-sort.dto";

describe("FindAllUserRoleUseCase ( UnitTest )", () => {

    let service: FindAllUserRoleUseCase;
    let userRoleRepository: jest.Mocked<IUserRoleRepository>;

    const mockRepository = {
        findAll: jest.fn(),
    };

    const userRole1: UserRole = {
        id: "1",
        userId: "user-uuid-1",
        roleId: "role-uuid-1",
        version: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
    };

    const userRole2: UserRole = {
        id: "2",
        userId: "user-uuid-2",
        roleId: "role-uuid-2",
        version: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
    };

    beforeEach(async () => {

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                FindAllUserRoleUseCase,
                {
                    provide: IUserRoleRepository,
                    useValue: mockRepository,
                },
            ],
        }).compile();

        service = module.get(FindAllUserRoleUseCase);
        userRoleRepository = module.get(IUserRoleRepository);

    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should be defined", () => {
        expect(service).toBeDefined();
        expect(userRoleRepository).toBeDefined();
    });

    describe("execute", () => {

        it("should return a page of user roles", async () => {

            const filter = new UserRoleFilter();
            filter.loadUser = true;
            filter.loadRole = true;

            const pageable = new Pageable<UserRoleSort>();
            pageable.page = 1;
            pageable.size = 20;
            pageable.sortBy = UserRoleSort.CREATED_AT; 

            const page = new Page<UserRole>(
                [userRole1, userRole2],
                1,
                20,
                2,
            );

            userRoleRepository.findAll.mockResolvedValue(page);

            const result = await service.execute(
                filter,
                pageable,
            );

            expect(result.isSuccess).toBe(true);
            expect(result.value).toEqual(page);

            expect(userRoleRepository.findAll).toHaveBeenCalledTimes(1);
            expect(userRoleRepository.findAll).toHaveBeenCalledWith(
                filter,
                pageable,
            );

        });

        it("should return an empty page when no user roles are found", async () => {

            const filter = new UserRoleFilter();
            const pageable = new Pageable<UserRoleSort>();

            const page = new Page<UserRole>(
                [],
                1,
                20,
                0,
            );

            userRoleRepository.findAll.mockResolvedValue(page);

            const result = await service.execute(
                filter,
                pageable,
            );

            expect(result.isSuccess).toBe(true);
            expect(result.value.content).toHaveLength(0);
            expect(result.value.totalElements).toBe(0);

            expect(userRoleRepository.findAll).toHaveBeenCalledTimes(1);
            expect(userRoleRepository.findAll).toHaveBeenCalledWith(
                filter,
                pageable,
            );

        });

    });

});