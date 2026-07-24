import { Test, TestingModule } from "@nestjs/testing";


import { IUserRepository } from "../../repository/iuser.repository";

import { User } from "../../entities/user.entity";


import { Page, Pageable } from "src/common/page/page";
import { FindAllUserUseCase } from "./find-all.use-case.service";
import { UserFilter } from "../../dto/user-filter.filter";
import { UserSort } from "../../dto/user-sort.page";


describe("FindAllUserUseCase ( UnitTest )", () => {

    let service: FindAllUserUseCase;

    let userRepository: jest.Mocked<IUserRepository>;

    const mockRepository = {
        findAll: jest.fn(),
    };

    const user1 = User.create({
        id: "1",
        name: "John",
        fullName: "John Doe",
        email: "john@email.com",
        passwordHash: "hash",
    });

    const user2 = User.create({
        id: "2",
        name: "Mary",
        fullName: "Mary Doe",
        email: "mary@email.com",
        passwordHash: "hash",
    });

    beforeEach(async () => {

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                FindAllUserUseCase,
                {
                    provide: IUserRepository,
                    useValue: mockRepository,
                },
            ],
        }).compile();

        service = module.get(FindAllUserUseCase);

        userRepository = module.get(IUserRepository);

    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should be defined", () => {

        expect(service).toBeDefined();

        expect(userRepository).toBeDefined();

    });

    describe("execute", () => {

        it("should return a page of users", async () => {

            const filter = new UserFilter();

            const pageable = new Pageable<UserSort>();

            pageable.page = 1;
            pageable.size = 20;
            pageable.sortBy = UserSort.CREATED_AT;

            const page = new Page<User>(
                [user1, user2],
                1,
                20,
                2,
            );

            userRepository.findAll.mockResolvedValue(page);

            const result = await service.execute(
                filter,
                pageable,
            );

            expect(result.isSuccess).toBe(true);

            expect(result.value).toEqual(page);

            expect(userRepository.findAll)
                .toHaveBeenCalledTimes(1);

            expect(userRepository.findAll)
                .toHaveBeenCalledWith(
                    filter,
                    pageable,
                );

        });

        it("should return an empty page when no users are found", async () => {

            const filter = new UserFilter();

            const pageable = new Pageable<UserSort>();

            const page = new Page<User>(
                [],
                1,
                20,
                0,
            );

            userRepository.findAll.mockResolvedValue(page);

            const result = await service.execute(
                filter,
                pageable,
            );

            expect(result.isSuccess).toBe(true);

            expect(result.value.content).toHaveLength(0);

            expect(result.value.totalElements).toBe(0);

        });

    });

});