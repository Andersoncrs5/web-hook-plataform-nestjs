import { Test, TestingModule } from '@nestjs/testing';
import { DeleteOrganizationByIdUseCase } from './delete-organization-by-id.use-case.service';
import { IOrganizationRepository } from '../../repository/iorganization.repository';
import { OrganizationEntity } from '../../entities/organization.entity';
import { OrganizationStatus } from 'src/common/enums/organization/organization-status.enum';

describe('DeleteOrganizationByIdUseCase ( UnitTest )', () => {
    let service: DeleteOrganizationByIdUseCase;
    let repository: jest.Mocked<IOrganizationRepository>;

    const mockIOrganizationRepository = {
        findById: jest.fn(),
        deleteById: jest.fn(),
    };

    const validUuid = '123e4567-e89b-12d3-a456-426614174000';
    const invalidUuid = 'invalid-uuid-1234';
    const ownerUserId = 'user-owner-1234-5678';
    const otherUserId = 'user-other-1234-5678';

    const organizationMock: OrganizationEntity = {
        id: validUuid,
        name: 'Acme Corp',
        slug: 'acme-corp',
        status: OrganizationStatus.ACTIVE,
        userId: ownerUserId,
        metadata: { tier: 'pro' },
        version: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DeleteOrganizationByIdUseCase,
                {
                    provide: IOrganizationRepository,
                    useValue: mockIOrganizationRepository,
                },
            ],
        }).compile();

        service = module.get<DeleteOrganizationByIdUseCase>(DeleteOrganizationByIdUseCase);
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
        it('should return bad request when id is not a valid UUID', async () => {
            const result = await service.execute(invalidUuid, ownerUserId);

            expect(result).toBeDefined();
            expect(result.isSuccess).toBe(false);
            expect(result.errors[0]).toBe('Id should be a UUID');
            expect(repository.findById).not.toHaveBeenCalled();
            expect(repository.deleteById).not.toHaveBeenCalled();
        });

        it('should return not found when organization does not exist', async () => {
            repository.findById.mockResolvedValue(null);

            const result = await service.execute(validUuid, ownerUserId);

            expect(result).toBeDefined();
            expect(result.isSuccess).toBe(false);
            expect(result.errors[0]).toBe('Organization not found');
            expect(repository.findById).toHaveBeenCalledTimes(1);
            expect(repository.findById).toHaveBeenCalledWith(validUuid);
            expect(repository.deleteById).not.toHaveBeenCalled();
        });

        it('should return forbidden when user does not own the organization', async () => {
            repository.findById.mockResolvedValue(organizationMock);

            const result = await service.execute(validUuid, otherUserId);

            expect(result).toBeDefined();
            expect(result.isSuccess).toBe(false);
            expect(result.errors[0]).toBe('You do not own this organization');
            expect(repository.findById).toHaveBeenCalledTimes(1);
            expect(repository.findById).toHaveBeenCalledWith(validUuid);
            expect(repository.deleteById).not.toHaveBeenCalled();
        });

        it('should successfully delete organization when user is the owner (Happy Path)', async () => {
            repository.findById.mockResolvedValue(organizationMock);
            repository.deleteById.mockResolvedValue(true);

            const result = await service.execute(validUuid, ownerUserId);

            expect(result).toBeDefined();
            expect(result.isSuccess).toBe(true);
            expect(result.value).toEqual(organizationMock);

            expect(repository.findById).toHaveBeenCalledTimes(1);
            expect(repository.findById).toHaveBeenCalledWith(validUuid);

            expect(repository.deleteById).toHaveBeenCalledTimes(1);
            expect(repository.deleteById).toHaveBeenCalledWith(organizationMock.id);
        });
    });
});