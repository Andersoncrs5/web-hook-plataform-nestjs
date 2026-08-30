import { INestApplication } from '@nestjs/common';

import { BaseIntegrationTest } from '../../../../test/helpers/base-test.helper';
import { BaseTestHelper } from '../../../../test/helpers/integration-test.helper';

import { UserRepository } from 'src/modules/user/repository/user.repository';
import { UserStatus } from 'src/common/enums/user/user-status.enum';
import {
    Pageable,
    SortDirection,
} from 'src/common/page/page';
import { UserSort } from 'src/modules/user/dto/user-sort.page';

describe('UserRepository (Integration Test)', () => {
    let app: INestApplication;
    let helper: BaseTestHelper;
    let repository: UserRepository;

    beforeAll(async () => {
        await BaseIntegrationTest.setupAll();

        app = BaseIntegrationTest.getApp();
        helper = new BaseTestHelper(app);
        repository = app.get(UserRepository);
    }, 180000);

    afterAll(async () => {
        await BaseIntegrationTest.teardownAll();
    });

    describe('initialization', () => {
        it('should be defined', () => {
            expect(app).toBeDefined();
            expect(helper).toBeDefined();
            expect(repository).toBeDefined();
        });
    });

    describe('create', () => {
        it('should create and persist a user', async () => {
            const user = await helper.createFakeUser();

            const created = await repository.create(user);

            expect(created).toEqual(
                expect.objectContaining({
                    id: user.id,
                    name: user.name,
                    fullName: user.fullName,
                    email: user.email,
                    status: user.status,
                    version: user.version,
                }),
            );

            const persisted = await repository.findById(user.id);

            expect(persisted).not.toBeNull();
            expect(persisted).toEqual(
                expect.objectContaining({
                    id: user.id,
                    name: user.name,
                    fullName: user.fullName,
                    email: user.email,
                    status: user.status,
                }),
            );
        });
    });

    describe('findById', () => {
        it('should return the user when the id exists', async () => {
            const user = await helper.createFakeUser();
            await repository.create(user);

            const result = await repository.findById(user.id);

            expect(result).not.toBeNull();
            expect(result?.id).toBe(user.id);
            expect(result?.email).toBe(user.email);
        });

        it('should return null when the id does not exist', async () => {
            const id = helper.generateUuid();

            const result = await repository.findById(id);

            expect(result).toBeNull();
        });
    });

    describe('findByEmail', () => {
        it('should return the user when the email exists', async () => {
            const user = await helper.createFakeUser();
            await repository.create(user);

            const result = await repository.findByEmail(user.email);

            expect(result).not.toBeNull();
            expect(result?.id).toBe(user.id);
            expect(result?.email).toBe(user.email);
        });

        it('should return null when the email does not exist', async () => {
            const email =
                `nonexistent_${helper.getRandomString()}@example.com`;

            const result = await repository.findByEmail(email);

            expect(result).toBeNull();
        });
    });

    describe('existsById', () => {
        it('should return true when the user exists', async () => {
            const user = await helper.createFakeUser();
            await repository.create(user);

            await expect(
                repository.existsById(user.id),
            ).resolves.toBe(true);
        });

        it('should return false when the user does not exist', async () => {
            const id = helper.generateUuid();

            await expect(
                repository.existsById(id),
            ).resolves.toBe(false);
        });
    });

    describe('findAll', () => {
        it('should return all users when no filters are provided', async () => {
            const user1 = await helper.createFakeUser();
            const user2 = await helper.createFakeUser();

            await repository.create(user1);
            await repository.create(user2);

            const pageable: Pageable<UserSort> = {
                page: 1,
                size: 100,
                sortBy: UserSort.CREATED_AT,
                direction: SortDirection.ASC,
            };

            const result = await repository.findAll(
                {},
                pageable,
            );

            expect(result).toBeDefined();
            expect(result.content).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        id: user1.id,
                    }),
                    expect.objectContaining({
                        id: user2.id,
                    }),
                ]),
            );

            expect(result.totalElements).toBeGreaterThanOrEqual(2);
        });

        it('should filter users by name', async () => {
            const searchableName =
                `Searchable_${helper.getRandomString()}`;

            const matchingUser = await helper.createFakeUser({
                name: searchableName,
            });

            const anotherMatchingUser =
                await helper.createFakeUser({
                    name: `${searchableName}_Second`,
                });

            const unrelatedUser =
                await helper.createFakeUser({
                    name: `Other_${helper.getRandomString()}`,
                });

            await repository.create(matchingUser);
            await repository.create(anotherMatchingUser);
            await repository.create(unrelatedUser);

            const pageable = createPageable();

            const result = await repository.findAll(
                {
                    name: searchableName,
                },
                pageable,
            );

            const ids = result.content.map(
                (user) => user.id,
            );

            expect(ids).toContain(matchingUser.id);
            expect(ids).toContain(anotherMatchingUser.id);
            expect(ids).not.toContain(unrelatedUser.id);
            expect(result.totalElements).toBe(2);
        });

        it('should filter users by email', async () => {
            const emailPrefix =
                `search_${helper.getRandomString()}`;

            const matchingUser =
                await helper.createFakeUser({
                    email: `${emailPrefix}@example.com`,
                });

            const unrelatedUser =
                await helper.createFakeUser({
                    email: `other_${helper.getRandomString()}@example.com`,
                });

            await repository.create(matchingUser);
            await repository.create(unrelatedUser);

            const result = await repository.findAll(
                {
                    email: emailPrefix,
                },
                createPageable(),
            );

            expect(result.totalElements).toBe(1);
            expect(result.content[0]?.id).toBe(
                matchingUser.id,
            );
        });

        it('should filter users by status', async () => {
            const activeUser =
                await helper.createFakeUser({
                    status: UserStatus.ACTIVE,
                });

            const inactiveUser =
                await helper.createFakeUser({
                    status: UserStatus.INACTIVE,
                });

            await repository.create(activeUser);
            await repository.create(inactiveUser);

            const result = await repository.findAll(
                {
                    status: UserStatus.ACTIVE,
                },
                createPageable(),
            );

            expect(
                result.content.every(
                    (user) =>
                        user.status === UserStatus.ACTIVE,
                ),
            ).toBe(true);

            expect(
                result.content.some(
                    (user) => user.id === activeUser.id,
                ),
            ).toBe(true);

            expect(
                result.content.some(
                    (user) => user.id === inactiveUser.id,
                ),
            ).toBe(false);
        });

        it('should paginate results', async () => {
            const users = await Promise.all(
                Array.from({ length: 5 }, () =>
                    helper.createFakeUser(),
                ),
            );

            for (const user of users) {
                await repository.create(user);
            }

            const firstPage = await repository.findAll(
                {},
                {
                    page: 1,
                    size: 2,
                    sortBy: UserSort.CREATED_AT,
                    direction: SortDirection.ASC,
                },
            );

            const secondPage = await repository.findAll(
                {},
                {
                    page: 2,
                    size: 2,
                    sortBy: UserSort.CREATED_AT,
                    direction: SortDirection.ASC,
                },
            );

            expect(firstPage.content).toHaveLength(2);
            expect(secondPage.content).toHaveLength(2);

            expect(firstPage.totalElements)
                .toBeGreaterThanOrEqual(5);

            const firstIds = firstPage.content.map(
                (user) => user.id,
            );

            const secondIds = secondPage.content.map(
                (user) => user.id,
            );

            expect(
                firstIds.some((id) =>
                    secondIds.includes(id),
                ),
            ).toBe(false);
        });

        it('should sort results in ascending order', async () => {
            const older = await helper.createFakeUser({
                name: 'AAA',
            });

            const newer = await helper.createFakeUser({
                name: 'ZZZ',
            });

            await repository.create(older);
            await repository.create(newer);

            const result = await repository.findAll(
                {},
                {
                    page: 1,
                    size: 100,
                    sortBy: UserSort.NAME,
                    direction: SortDirection.ASC,
                },
            );

            const relevantUsers = result.content.filter(
                (user) =>
                    user.id === older.id ||
                    user.id === newer.id,
            );

            expect(
                relevantUsers.map((user) => user.name),
            ).toEqual(['AAA', 'ZZZ']);
        });
    });

    describe('update', () => {
        it('should update the user and increment the version', async () => {
            const user = await helper.createFakeUser();
            const created = await repository.create(user);

            const updated = {
                ...created,
                name: `Updated_${helper.getRandomString()}`,
                fullName: `Updated Full Name`,
                status: UserStatus.INACTIVE,
            };

            const result = await repository.update(updated);

            expect(result.id).toBe(created.id);
            expect(result.name).toBe(updated.name);
            expect(result.fullName).toBe(
                updated.fullName,
            );
            expect(result.status).toBe(
                UserStatus.INACTIVE,
            );
            expect(result.version).toBe(
                created.version + 1,
            );

            const persisted =
                await repository.findById(created.id);

            expect(persisted).not.toBeNull();
            expect(persisted?.name).toBe(updated.name);
            expect(persisted?.fullName).toBe(
                updated.fullName,
            );
            expect(persisted?.status).toBe(
                UserStatus.INACTIVE,
            );
            expect(persisted?.version).toBe(
                created.version + 1,
            );
        });
    });

    describe('deleteById', () => {
        it('should delete an existing user', async () => {
            const user = await helper.createFakeUser();
            await repository.create(user);

            const deleted =
                await repository.deleteById(user.id);

            expect(deleted).toBe(true);

            await expect(
                repository.findById(user.id),
            ).resolves.toBeNull();
        });

        it('should return false when the user does not exist', async () => {
            const id = helper.generateUuid();

            await expect(
                repository.deleteById(id),
            ).resolves.toBe(false);
        });
    });

    describe('deleteByIdAndCount', () => {
        it('should return 1 when an existing user is deleted', async () => {
            const user = await helper.createFakeUser();
            await repository.create(user);

            await expect(
                repository.deleteByIdAndCount(user.id),
            ).resolves.toBe(1);

            await expect(
                repository.findById(user.id),
            ).resolves.toBeNull();
        });

        it('should return 0 when the user does not exist', async () => {
            const id = helper.generateUuid();

            await expect(
                repository.deleteByIdAndCount(id),
            ).resolves.toBe(0);
        });
    });

    describe('existsByEmail', () => {
        it('should return true when the email exists', async () => {
            const user = await helper.createFakeUser();
            await repository.create(user);

            await expect(
                repository.existsByEmail(user.email),
            ).resolves.toBe(true);
        });

        it('should return false when the email does not exist', async () => {
            const email =
                `nonexistent_${helper.getRandomString()}@example.com`;

            await expect(
                repository.existsByEmail(email),
            ).resolves.toBe(false);
        });
    });

    describe('existsByName', () => {
        it('should return true when the name exists', async () => {
            const user = await helper.createFakeUser();
            await repository.create(user);

            await expect(
                repository.existsByName(user.name),
            ).resolves.toBe(true);
        });

        it('should return false when the name does not exist', async () => {
            const name = `NonExistentName_${helper.getRandomString()}`;

            await expect(
                repository.existsByName(name),
            ).resolves.toBe(false);
        });
    });

    function createPageable(): Pageable<UserSort> {
        return {
            page: 1,
            size: 100,
            sortBy: UserSort.CREATED_AT,
            direction: SortDirection.ASC,
        };
    }
});
