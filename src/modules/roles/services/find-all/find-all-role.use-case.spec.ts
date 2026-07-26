import { Test, TestingModule } from "@nestjs/testing";

import { IRoleRepository } from "../../repository/iroles.repository";
import { Role } from "../../entities/role.entity";

import { Page, Pageable } from "src/common/page/page";
import { FindAllRoleUseCase } from "./find-all-role.use-case.service";
import { RoleFilter } from "../../dto/role-filter.dto";
import { RoleSort } from "../../dto/role-sort.dto";

describe("FindAllRoleUseCase ( UnitTest )", () => {

    let service: FindAllRoleUseCase;
    let roleRepository: jest.Mocked<IRoleRepository>;

    const mockRepository = {
        findAll: jest.fn(),
    };

    const role1: Role = {
        id: "1",
        name: "Admin",
        description: "Administrator role",
        isActive: true,
        version: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const role2: Role = {
        id: "2",
        name: "User",
        description: "Standard user role",
        isActive: true,
        version: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    beforeEach(async () => {

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                FindAllRoleUseCase,
                {
                    provide: IRoleRepository,
                    useValue: mockRepository,
                },
            ],
        }).compile();

        service = module.get(FindAllRoleUseCase);
        roleRepository = module.get(IRoleRepository);

    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should be defined", () => {
        expect(service).toBeDefined();
        expect(roleRepository).toBeDefined();
    });

    describe("execute", () => {

        it("should return a page of roles", async () => {

            const filter = new RoleFilter();
            const pageable = new Pageable<RoleSort>();

            pageable.page = 1;
            pageable.size = 20;
            
            pageable.sortBy = RoleSort.CREATED_AT; 

            const page = new Page<Role>(
                [role1, role2],
                1,
                20,
                2,
            );

            roleRepository.findAll.mockResolvedValue(page);

            const result = await service.execute(
                filter,
                pageable,
            );

            expect(result.isSuccess).toBe(true);
            expect(result.value).toEqual(page);

            expect(roleRepository.findAll).toHaveBeenCalledTimes(1);
            expect(roleRepository.findAll).toHaveBeenCalledWith(
                filter,
                pageable,
            );

        });

        it("should return an empty page when no roles are found", async () => {

            const filter = new RoleFilter();
            const pageable = new Pageable<RoleSort>();

            const page = new Page<Role>(
                [],
                1,
                20,
                0,
            );

            roleRepository.findAll.mockResolvedValue(page);

            const result = await service.execute(
                filter,
                pageable,
            );

            expect(result.isSuccess).toBe(true);
            expect(result.value.content).toHaveLength(0);
            expect(result.value.totalElements).toBe(0);

            expect(roleRepository.findAll).toHaveBeenCalledTimes(1);
            expect(roleRepository.findAll).toHaveBeenCalledWith(
                filter,
                pageable,
            );

        });

    });

});