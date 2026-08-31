import { Test, TestingModule } from '@nestjs/testing';
import { CreateOrganizationUseCase } from './create-organization.use-case.service';
import { IOrganizationRepository } from '../../repository/iorganization.repository';
import { CreateOrganizationDto } from '../../dto/request/create-organization.dto';
import { OrganizationEntity } from '../../entities/organization.entity';
import { OrganizationStatus } from 'src/common/enums/organization/organization-status.enum';
import { InternalServerErrorException } from '@nestjs/common';

describe('CreateOrganizationUseCase ( UnitTest )', () => {
    let service: CreateOrganizationUseCase;
    let repository: jest.Mocked<IOrganizationRepository>;

    const mockIOrganizationRepository = {
        create: jest.fn(),
    };

    const userIdMock = 'user-uuid-1234-5678';
    const fakeUuid = 'org-uuid-1234-5678';

    const dtoMock: CreateOrganizationDto = {
        name: 'Acme Corp',
        slug: 'acme-corp',
        status: OrganizationStatus.ACTIVE,
        metadata: { tier: 'pro' },
    };

    const organizationMock: OrganizationEntity = {
        id: fakeUuid,
        name: dtoMock.name,
        slug: dtoMock.slug,
        status: OrganizationStatus.ACTIVE,
        userId: userIdMock,
        metadata: dtoMock.metadata,
        version: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CreateOrganizationUseCase,
                {
                    provide: IOrganizationRepository,
                    useValue: mockIOrganizationRepository,
                },
            ],
        }).compile();

        service = module.get<CreateOrganizationUseCase>(CreateOrganizationUseCase);
        repository = module.get(IOrganizationRepository);
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined and dependencies correctly mocked', () => {
        expect(service).toBeDefined();
        expect(repository).toBeDefined();
    });

    describe('execute', () => {
        it('should successfully create an organization (Happy Path)', async () => {
            repository.create.mockResolvedValue(organizationMock);

            const result = await service.execute(dtoMock, userIdMock);

            expect(result).toBeDefined();
            expect(result.isSuccess).toBe(true);
            expect(result.value).toEqual(organizationMock);

            expect(repository.create).toHaveBeenCalledTimes(1);
            expect(repository.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    name: dtoMock.name,
                    slug: dtoMock.slug,
                    status: dtoMock.status,
                    userId: userIdMock,
                    metadata: dtoMock.metadata,
                })
            );
        });

        describe('Database Constraint Violations (Sad Paths)', () => {

            describe('Unique Constraint Violations (23505)', () => {
                it('should return conflict result when organization name is duplicated (via constraint_name)', async () => {
                    const dbError = {
                        cause: {
                            code: '23505',
                            constraint_name: 'uk_name_organization',
                            detail: 'Key (name)=(Acme Corp) already exists.',
                        },
                    };
                    repository.create.mockRejectedValue(dbError);

                    const result = await service.execute(dtoMock, userIdMock);

                    expect(result.isSuccess).toBe(false);
                    expect(result.errors[0]).toBe(`Name: '${dtoMock.name}' already exists`);
                });

                it('should return conflict result when organization name is duplicated (via detail fallback)', async () => {
                    const dbError = {
                        cause: {
                            code: '23505',
                            detail: 'Key (name)=(Acme Corp) already exists.',
                        },
                    };
                    repository.create.mockRejectedValue(dbError);

                    const result = await service.execute(dtoMock, userIdMock);

                    expect(result.isSuccess).toBe(false);
                    expect(result.errors[0]).toBe(`Name: '${dtoMock.name}' already exists`);
                });

                it('should return conflict result when organization slug is duplicated (via constraint_name)', async () => {
                    const dbError = {
                        cause: {
                            code: '23505',
                            constraint_name: 'uk_slug_organization',
                            detail: 'Key (slug)=(acme-corp) already exists.',
                        },
                    };
                    repository.create.mockRejectedValue(dbError);

                    const result = await service.execute(dtoMock, userIdMock);

                    expect(result.isSuccess).toBe(false);
                    expect(result.errors[0]).toBe(`Slug: '${dtoMock.slug}' already exists`);
                });

                it('should return conflict result when organization slug is duplicated (via detail fallback)', async () => {
                    const dbError = {
                        cause: {
                            code: '23505',
                            detail: 'Key (slug)=(acme-corp) already exists.',
                        },
                    };
                    repository.create.mockRejectedValue(dbError);

                    const result = await service.execute(dtoMock, userIdMock);

                    expect(result.isSuccess).toBe(false);
                    expect(result.errors[0]).toBe(`Slug: '${dtoMock.slug}' already exists`);
                });

                it('should return generic conflict result for unspecified unique constraint (23505)', async () => {
                    const dbError = {
                        cause: {
                            code: '23505',
                            detail: 'Some other unique violation',
                        },
                    };
                    repository.create.mockRejectedValue(dbError);

                    const result = await service.execute(dtoMock, userIdMock);

                    expect(result.isSuccess).toBe(false);
                    expect(result.errors[0]).toBe('Data conflict detected.');
                });
            });

            describe('Foreign Key Violations (23503)', () => {
                it('should return notFound result when specified user does not exist (via cause.constraint_name)', async () => {
                    const dbError = {
                        cause: {
                            code: '23503',
                            constraint_name: 'organizations_user_id_users_id_fk',
                            detail: 'Key (user_id)=(123) is not present in table users.',
                        },
                    };
                    repository.create.mockRejectedValue(dbError);

                    const result = await service.execute(dtoMock, userIdMock);

                    expect(result.isSuccess).toBe(false);
                    expect(result.errors[0]).toBe('The specified User does not exist.');
                });

                it('should return notFound result when specified user does not exist (via cause.detail)', async () => {
                    const dbError = {
                        cause: {
                            code: '23503',
                            detail: 'Key (user_id)=(123) is not present in table users.',
                        },
                    };
                    repository.create.mockRejectedValue(dbError);

                    const result = await service.execute(dtoMock, userIdMock);

                    expect(result.isSuccess).toBe(false);
                    expect(result.errors[0]).toBe('The specified User does not exist.');
                });

                it('should return notFound result when specified user does not exist (via cause.message)', async () => {
                    const dbError = {
                        cause: {
                            code: '23503',
                            message: 'insert or update on table "organizations" violates foreign key constraint "organizations_user_id_users_id_fk"',
                        },
                    };
                    repository.create.mockRejectedValue(dbError);

                    const result = await service.execute(dtoMock, userIdMock);

                    expect(result.isSuccess).toBe(false);
                    expect(result.errors[0]).toBe('The specified User does not exist.');
                });

                it('should return badRequest result for unspecified foreign key violation (23503)', async () => {
                    const dbError = {
                        cause: {
                            code: '23503',
                            detail: 'Key (other_id)=(123) not present',
                        },
                    };
                    repository.create.mockRejectedValue(dbError);

                    const result = await service.execute(dtoMock, userIdMock);

                    expect(result.isSuccess).toBe(false);
                    expect(result.errors[0]).toBe('Related record not found.');
                });
            });

            describe('Other Database Errors', () => {
                it('should return bad request result on null violation (23502)', async () => {
                    const dbError = {
                        cause: {
                            code: '23502',
                            column: 'name',
                        },
                    };
                    repository.create.mockRejectedValue(dbError);

                    const result = await service.execute(dtoMock, userIdMock);

                    expect(result.isSuccess).toBe(false);
                    expect(result.errors[0]).toBe('The field "name" cannot be null.');
                });

                it('should handle missing column property on null violation gracefully (23502)', async () => {
                    const dbError = {
                        cause: {
                            code: '23502',
                        },
                    };
                    repository.create.mockRejectedValue(dbError);

                    const result = await service.execute(dtoMock, userIdMock);

                    expect(result.isSuccess).toBe(false);
                    expect(result.errors[0]).toBe('The field "unknown field" cannot be null.');
                });

                it('should return bad request result when field size exceeds limit (22001)', async () => {
                    const dbError = {
                        cause: {
                            code: '22001',
                        },
                    };
                    repository.create.mockRejectedValue(dbError);

                    const result = await service.execute(dtoMock, userIdMock);

                    expect(result.isSuccess).toBe(false);
                    expect(result.errors[0]).toBe('One or more fields exceed the maximum allowed length.');
                });

                it('should throw InternalServerErrorException for unhandled database errors', async () => {
                    const unknownError = new Error('Random database failure');
                    repository.create.mockRejectedValue(unknownError);

                    await expect(service.execute(dtoMock, userIdMock)).rejects.toThrow(
                        InternalServerErrorException,
                    );
                    await expect(service.execute(dtoMock, userIdMock)).rejects.toThrow(
                        'Error creating organization.',
                    );

                    expect(repository.create).toHaveBeenCalledTimes(2);
                });
            });
        });
    });
});