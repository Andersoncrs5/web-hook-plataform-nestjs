import { Test, TestingModule } from '@nestjs/testing';
import { UpdateOrganizationUseCase } from './update-organization.use-case.service';
import { IOrganizationRepository } from '../../repository/iorganization.repository';
import { UpdateOrganizationDto } from '../../dto/request/update-organization.dto';
import { OrganizationEntity } from '../../entities/organization.entity';
import { OrganizationStatus } from 'src/common/enums/organization/organization-status.enum';
import { InternalServerErrorException } from '@nestjs/common';
import { OrganizationMapper } from '../../mapper/organization.mapper';

jest.mock('../../mapper/organization.mapper', () => ({
    OrganizationMapper: {
        merge: jest.fn(),
    },
}));

describe('UpdateOrganizationUseCase ( UnitTest )', () => {
    let service: UpdateOrganizationUseCase;
    let repository: jest.Mocked<IOrganizationRepository>;

    const mockIOrganizationRepository = {
        findById: jest.fn(),
        update: jest.fn(),
    };

    const validOrgId = '123e4567-e89b-12d3-a456-426614174000';
    const validUserId = '987e6543-e21b-12d3-a456-426614174000';
    const invalidUuid = 'invalid-uuid-1234';

    const dtoMock: UpdateOrganizationDto = {
        name: 'Updated Name',
        slug: 'updated-slug',
        status: OrganizationStatus.ACTIVE,
        metadata: { tier: 'enterprise' },
    };

    const existingOrgMock: OrganizationEntity = {
        id: validOrgId,
        name: 'Original Name',
        slug: 'original-slug',
        status: OrganizationStatus.ACTIVE,
        userId: validUserId,
        metadata: { tier: 'free' },
        version: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
    };

    const updatedOrgMock: OrganizationEntity = {
        ...existingOrgMock,
        name: dtoMock.name!,
        slug: dtoMock.slug!,
        metadata: dtoMock.metadata!,
        version: 1,
        updatedAt: new Date(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UpdateOrganizationUseCase,
                {
                    provide: IOrganizationRepository,
                    useValue: mockIOrganizationRepository,
                },
            ],
        }).compile();

        service = module.get<UpdateOrganizationUseCase>(UpdateOrganizationUseCase);
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
        describe('Validation Errors', () => {
            it('should return bad request when organization id is not a valid UUID', async () => {
                const result = await service.execute(invalidUuid, dtoMock, validUserId);

                expect(result).toBeDefined();
                expect(result.isSuccess).toBe(false);
                expect(result.errors[0]).toBe('Id should be a UUID');
                expect(repository.findById).not.toHaveBeenCalled();
                expect(repository.update).not.toHaveBeenCalled();
            });

            it('should return bad request when userId is not a valid UUID', async () => {
                const result = await service.execute(validOrgId, dtoMock, invalidUuid);

                expect(result).toBeDefined();
                expect(result.isSuccess).toBe(false);
                expect(result.errors[0]).toBe('User Id should be a UUID');
                expect(repository.findById).not.toHaveBeenCalled();
                expect(repository.update).not.toHaveBeenCalled();
            });
        });

        describe('Not Found', () => {
            it('should return not found when organization does not exist', async () => {
                repository.findById.mockResolvedValue(null);

                const result = await service.execute(validOrgId, dtoMock, validUserId);

                expect(result).toBeDefined();
                expect(result.isSuccess).toBe(false);
                expect(result.errors[0]).toBe('Organization not found');
                expect(repository.findById).toHaveBeenCalledTimes(1);
                expect(repository.findById).toHaveBeenCalledWith(validOrgId);
                expect(repository.update).not.toHaveBeenCalled();
            });
        });

        describe('Happy Path', () => {
            it('should successfully merge, update and return the organization', async () => {
                repository.findById.mockResolvedValue(existingOrgMock);
                repository.update.mockResolvedValue(updatedOrgMock);

                const result = await service.execute(validOrgId, dtoMock, validUserId);

                expect(result).toBeDefined();
                expect(result.isSuccess).toBe(true);
                expect(result.value).toEqual(updatedOrgMock);

                expect(repository.findById).toHaveBeenCalledTimes(1);
                expect(repository.findById).toHaveBeenCalledWith(validOrgId);

                expect(OrganizationMapper.merge).toHaveBeenCalledTimes(1);
                expect(OrganizationMapper.merge).toHaveBeenCalledWith(existingOrgMock, dtoMock);

                expect(repository.update).toHaveBeenCalledTimes(1);
                expect(repository.update).toHaveBeenCalledWith(existingOrgMock);
            });
        });

        describe('Database Constraint Violations (Sad Paths)', () => {
            beforeEach(() => {
                repository.findById.mockResolvedValue(existingOrgMock);
            });

            it('should return conflict result when organization name is duplicated (23505 - uk_name_organization constraint)', async () => {
                const dbError = {
                    code: '23505',
                    constraint_name: 'uk_name_organization',
                };
                repository.update.mockRejectedValue(dbError);

                const result = await service.execute(validOrgId, dtoMock, validUserId);

                expect(result.isSuccess).toBe(false);
                expect(result.errors[0]).toBe(`Name: '${dtoMock.name}' already exists`);
                expect(repository.update).toHaveBeenCalledTimes(1);
            });

            it('should return conflict result when organization name is duplicated (23505 - detail contains name)', async () => {
                const dbError = {
                    code: '23505',
                    detail: `Key (name)=(${dtoMock.name}) already exists.`,
                };
                repository.update.mockRejectedValue(dbError);

                const result = await service.execute(validOrgId, dtoMock, validUserId);

                expect(result.isSuccess).toBe(false);
                expect(result.errors[0]).toBe(`Name: '${dtoMock.name}' already exists`);
            });

            it('should return conflict result when error is wrapped inside error.cause (Drizzle ORM)', async () => {
                const wrappedError = {
                    cause: {
                        code: '23505',
                        constraint: 'uk_name_organization',
                    },
                };
                repository.update.mockRejectedValue(wrappedError);

                const result = await service.execute(validOrgId, dtoMock, validUserId);

                expect(result.isSuccess).toBe(false);
                expect(result.errors[0]).toBe(`Name: '${dtoMock.name}' already exists`);
            });

            it('should return conflict result when organization slug is duplicated (23505 - uk_slug_organization constraint)', async () => {
                const dbError = {
                    code: '23505',
                    constraint: 'uk_slug_organization',
                };
                repository.update.mockRejectedValue(dbError);

                const result = await service.execute(validOrgId, dtoMock, validUserId);

                expect(result.isSuccess).toBe(false);
                expect(result.errors[0]).toBe(`Slug: '${dtoMock.slug}' already exists`);
                expect(repository.update).toHaveBeenCalledTimes(1);
            });

            it('should return conflict result when organization slug is duplicated (23505 - detail contains slug)', async () => {
                const dbError = {
                    code: '23505',
                    detail: `Key (slug)=(${dtoMock.slug}) already exists.`,
                };
                repository.update.mockRejectedValue(dbError);

                const result = await service.execute(validOrgId, dtoMock, validUserId);

                expect(result.isSuccess).toBe(false);
                expect(result.errors[0]).toBe(`Slug: '${dtoMock.slug}' already exists`);
            });

            it('should return generic conflict result for unspecified unique constraint (23505)', async () => {
                const dbError = { code: '23505', detail: 'Some other unique constraint violation' };
                repository.update.mockRejectedValue(dbError);

                const result = await service.execute(validOrgId, dtoMock, validUserId);

                expect(result.isSuccess).toBe(false);
                expect(result.errors[0]).toBe('Data conflict detected.');
            });

            it('should return notFound result when user does not exist (23503 - FK constraint)', async () => {
                const dbError = {
                    code: '23503',
                    constraint_name: 'organizations_user_id_users_id_fk',
                };
                repository.update.mockRejectedValue(dbError);

                const result = await service.execute(validOrgId, dtoMock, validUserId);

                expect(result.isSuccess).toBe(false);
                expect(result.errors[0]).toBe('The specified User does not exist.');
            });

            it('should return badRequest result for unspecified foreign key constraint (23503)', async () => {
                const dbError = { code: '23503', detail: 'Key (other_id)=(123) not present' };
                repository.update.mockRejectedValue(dbError);

                const result = await service.execute(validOrgId, dtoMock, validUserId);

                expect(result.isSuccess).toBe(false);
                expect(result.errors[0]).toBe('Related record not found.');
            });

            it('should return bad request result on null violation with column specified (23502)', async () => {
                const dbError = { code: '23502', column: 'name' };
                repository.update.mockRejectedValue(dbError);

                const result = await service.execute(validOrgId, dtoMock, validUserId);

                expect(result.isSuccess).toBe(false);
                expect(result.errors[0]).toBe('The field "name" cannot be null.');
            });

            it('should handle missing column property on null violation gracefully (23502)', async () => {
                const dbError = { code: '23502' };
                repository.update.mockRejectedValue(dbError);

                const result = await service.execute(validOrgId, dtoMock, validUserId);

                expect(result.isSuccess).toBe(false);
                expect(result.errors[0]).toBe('The field "unknown field" cannot be null.');
            });

            it('should return bad request result when field size exceeds limit (22001)', async () => {
                const dbError = { code: '22001' };
                repository.update.mockRejectedValue(dbError);

                const result = await service.execute(validOrgId, dtoMock, validUserId);

                expect(result.isSuccess).toBe(false);
                expect(result.errors[0]).toBe('One or more fields exceed the maximum allowed length.');
            });

            it('should throw InternalServerErrorException for unhandled database errors', async () => {
                const unknownError = new Error('Database disconnected');
                repository.update.mockRejectedValue(unknownError);

                await expect(service.execute(validOrgId, dtoMock, validUserId)).rejects.toThrow(
                    InternalServerErrorException,
                );
                await expect(service.execute(validOrgId, dtoMock, validUserId)).rejects.toThrow(
                    'Error updating organization.',
                );

                expect(repository.update).toHaveBeenCalledTimes(2);
            });
        });
    });
});